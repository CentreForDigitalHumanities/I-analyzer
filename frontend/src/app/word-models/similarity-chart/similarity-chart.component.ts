import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Chart, ChartData, ChartOptions, Filler, TooltipItem } from 'chart.js';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { selectColor } from '../../visualization/select-color';
import { freqTableHeaders, WordSimilarity } from '../../models';

/**
 * Child component of the related words and compare similarity graphs.
 * Handles making the visualisations: a graph with a line, stream and bar layout
 */
@Component({
    selector: 'ia-similarity-chart',
    templateUrl: './similarity-chart.component.html',
    styleUrls: ['./similarity-chart.component.scss']
})
export class SimilarityChartComponent implements OnInit, OnChanges {
    @Input() timeIntervals: string[];
    @Input() totalData: WordSimilarity[];
    @Input() zoomedInData: { [time: string]: WordSimilarity[]};
    @Input() asTable: boolean;
    @Input() palette: string[];
    @Input() tableFileName = 'similarty';

    terms: string[] = [];

    chartData: ChartData;
    chartOptions: ChartOptions = {};
    chart: Chart;

    tableHeaders: freqTableHeaders;
    tableData: WordSimilarity[];

    graphStyle = new BehaviorSubject<'line'|'stream'|'bar'>('line');

    currentTimeIndex = undefined;

    constructor() { }

    ngOnInit(): void {
        this.graphStyle.subscribe(this.updateChart.bind(this));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.totalData || changes.zoomedInData || changes.palette) {
            this.updateChart(this.graphStyle.value);
        }
    }

    zoomTimeInterval(timeIndex: number) {
        if (timeIndex !== this.currentTimeIndex) {
            this.currentTimeIndex = timeIndex;
            this.updateChart(this.graphStyle.value);
        }
    }

    setTableHeaders(): void {
        if (this.terms.length > 1) {
            this.tableHeaders = [
                { key: 'key', label: 'Term', isMainFactor: true, },
                { key: 'time', label: 'Time interval', isSecondaryFactor: true, },
                { key: 'similarity', label: 'Similarity', format: this.formatValue, formatDownload: this.formatDownloadValue }
            ];
        } else {
            this.tableHeaders = [
                { key: 'time', label: 'Time interval',},
                { key: 'similarity', label: 'Similarity', format: this.formatValue, formatDownload: this.formatDownloadValue }
            ];
        }
    }

    // makeTableData(): void {
    //     this.tableData = _.flatMap(_.zip(this.comparisonTerms, this.results), series => {
    //         const [term, result] = series;
    //         return _.zip(result.time_points, result.similarity_scores).map(point => {
    //             const [time, similarity] = point;
    //             return {
    //                 key: term,
    //                 similarity,
    //                 time,
    //             }
    //         })
    //     });
    // }

    formatValue(value: number): string {
        return `${value.toPrecision(3)}`;
    }

    formatDownloadValue(value: number): string {
        return `${value}`;
    }

    dataIndices(data: ChartData): number[] {
        return _.range(data.labels.length);
    }

    addZeroSeries(data: ChartData): ChartData {
        const indices = this.dataIndices(data);

        data.datasets.unshift(
            {
                label: '',
                data: indices.map(() => 0)
            }
        );

        return data;
    }


    stackData(data: ChartData): ChartData {
        const indices = this.dataIndices(data);

        const stackedDatasets = data.datasets.map((dataset, datasetIndex) => {
            if (datasetIndex > 0) {
                const newDataset = _.cloneDeep(dataset);
                const values = indices.map(index =>
                    _.sumBy(data.datasets.slice(0, datasetIndex + 1), d => (d.data[index] as number))
                );
                newDataset.data = values;
                return newDataset;
            } else {
                return dataset;
            }
        });

        return {
            labels: data.labels,
            datasets: stackedDatasets
        };
    }

    fixMean(data: ChartData): ChartData {
        const indices = this.dataIndices(data);

        const means = indices.map(index =>
            _.meanBy(data.datasets, dataset => dataset.data[index])
        );

        const transformedDatasets = data.datasets.map(dataset => {
            const clone = _.clone(dataset);
            clone.data = indices.map(index => (dataset.data[index] as number) - means[index]);
            return clone;
        });

        return {
            labels: data.labels,
            datasets: transformedDatasets,
        };
    }

    /**
     * Applies each data transformation necessary for stream format
     */
    transformStream(data: ChartData): ChartData {
        const transformations = [this.stackData, this.addZeroSeries, this.fixMean];
        const newData = _.reduce(transformations, (d, transformation) => transformation.bind(this)(d), data);
        return newData;
    }


    /** convert array of word similarities to a chartData object */
    makeChartData(data: WordSimilarity[], style: 'line'|'stream'|'bar'): ChartData {
        const allSeries = _.groupBy(data, point => point.key);
        const datasets = _.values(allSeries).map((series, datasetIndex) => {
            const label = series[0].key;
            const similarities = series.map(point => point.similarity);
            const colour = selectColor(this.palette, datasetIndex);
            return {
                label,
                data: similarities,
                borderColor: colour,
                backgroundColor: colour,
            };
        });

        const labels = (style == 'line'  || style  == 'stream') ? this.timeIntervals : [this.timeIntervals[this.currentTimeIndex]];

        return {
            labels,
            datasets,
        };
    }

    filterTimeInterval(data: WordSimilarity[], interval: string): WordSimilarity[] {
        return data.filter(point => point.time === interval);
    }

    updateChart(style: 'line'|'stream'|'bar'): void {
        let data: WordSimilarity[];
        if (style !== 'bar') {
            this.currentTimeIndex = undefined;
            data = this.totalData;
        } else {
            if (this.currentTimeIndex === undefined) { this.currentTimeIndex = 0; }
            const time = this.timeIntervals[this.currentTimeIndex];
            if (this.zoomedInData === undefined) {
                data = this.filterTimeInterval(this.totalData, time);
            } else {
                data = this.zoomedInData[time];
            }
        }

        this.chartData = this.makeChartData(data, style);
        this.makeChart(this.chartData, style);

    }

    makeChart(data: ChartData, style: 'line'|'stream'|'bar'): void {
        const options: ChartOptions = {
            elements: {
                line: {
                    tension: 0, // disables bezier curves
                },
                point: {
                    radius: 0, // hide points
                },
            },
            scales: {
                x: {},
                y: {
                    title: {
                        display: true,
                        text: 'Cosine similarity (SVD_PPMI)'
                    }
                },
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {}
                },
                tooltip: {
                    displayColors: true,
                    callbacks: {
                        labelColor(tooltipItem: any): any {
                            const color = tooltipItem.dataset.borderColor;
                            return {
                                borderColor: color,
                                backgroundColor: color,
                            };
                        },
                    }
                }
            }
        };

        if (style === 'line') {
            options.plugins.legend.labels = {
                boxHeight: 0, // flat boxes so the border is a line
            };
        }

        if (style === 'stream') {
            data = this.transformStream(data);
            data.datasets.forEach((dataset, index) => {
                dataset['fill'] = '-1';
            });
            options.elements.line.borderWidth = 0;
            options.plugins.legend.labels['filter'] = (legendItem, data) => legendItem.text !== '';

            const labelText = (context: TooltipItem<any>) => {
                if (context.datasetIndex > 0) {
                    const originalData = this.chartData.datasets[context.datasetIndex - 1].data;
                    const similarity = originalData[context.dataIndex];
                    return similarity.toString();
                }

            };

            options.plugins.tooltip.callbacks.label = labelText.bind(this);
        }

        if (style === 'bar') {
            // hide grid lines as we only have one data point on x axis
            data.datasets.forEach(dataset => dataset.type = 'bar');
            options.scales.x = {
                grid: {
                    display: false
                }
            };
        }

        if (this.chart) {
            this.chart.data = data;
            this.chart.options = options;
            this.chart.update();
        } else {
            this.chart = new Chart('chart', {
                type: 'line',
                data: data,
                options: options,
                plugins: [Filler]
            });
        }
    }
}
