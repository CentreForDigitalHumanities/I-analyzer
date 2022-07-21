import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Chart, ChartData, ChartOptions, Filler } from 'chart.js';
import { Corpus, freqTableHeaders, QueryModel, WordSimilarity } from '../../models';
import { selectColor } from '../select-color';
import { DialogService, SearchService } from '../../services/index';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

@Component({
    selector: 'ia-related-words',
    templateUrl: './related-words.component.html',
    styleUrls: ['./related-words.component.scss']
})
export class RelatedWordsComponent implements OnChanges, OnInit {
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

    totalData: {
        labels: string[],
        datasets: {
            label: string,
            data: number[],
            fill?: boolean,
            borderColor?: string,
            backgroundColor?: string
        }[]
    };


    graphStyle = new BehaviorSubject<'line'|'stream'|'bar'>('line');

    tableHeaders: freqTableHeaders = [
        { key: 'key', label: 'Term' },
        { key: 'similarity', label: 'Similarity', format: this.formatValue, formatDownload: this.formatDownloadValue }
    ];
    tableData: [WordSimilarity];

    currentTimeIndex = [0];
    public zoomedInData; // data requested when clicking on a time interval
    public chartOptions: ChartOptions = {};

    chart: Chart;

    constructor(private dialogService: DialogService, private searchService: SearchService) { }

    ngOnInit(): void {
        this.updateChart(this.graphStyle.value);
        this.graphStyle.subscribe(style => this.updateChart(style));
    }

    ngOnChanges() {
        this.getData();
    }

    getData() {
        this.isLoading.emit(true);
        this.searchService.getRelatedWords(this.queryModel.queryText, this.corpus.name).then(results => {
            this.totalData = results['graphData'];
            this.totalData.datasets.map((d, index) => {
                d.fill = false;
                d.borderColor = selectColor(this.palette, index);
                d.backgroundColor = selectColor(this.palette, index);
            });

            this.tableData = results['tableData'];
            this.updateChart(this.graphStyle.value);
            this.isLoading.emit(false);
        })
            .catch(error => {
                this.totalData = undefined;
                this.tableData = undefined;
                this.isLoading.emit(false);
                this.error.emit(error);

            });
    }

    zoomTimeInterval(event: any) {
        this.isLoading.emit(true);
        this.searchService.getRelatedWordsTimeInterval(
            this.queryModel.queryText,
            this.corpus.name,
            this.totalData.labels[event.value])
            .then(results => {
                this.zoomedInData = results['graphData'];
                this.zoomedInData.datasets
                    .sort((a, b) => { return b.data[0] - a.data[0] })
                    .map((d, index) => {
                        d.backgroundColor = selectColor(this.palette, index);
                        d.hoverBackgroundColor = selectColor(this.palette, index);
                    });
                    this.updateChart('bar');
                this.isLoading.emit(false);
            })
            .catch(error => {
                this.error.emit(error['message']);
            });
    }

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

    updateChart(style: 'line'|'stream'|'bar'): void {
        if (style !== 'bar') {
            this.zoomedInData = undefined;
            const data = _.cloneDeep(this.totalData);
            this.makeChart(data, style);
        } else {
            if (this.zoomedInData === undefined) {
                this.zoomTimeInterval({value: this.currentTimeIndex});
            } else {
                this.makeChart(this.zoomedInData, style);
            }
        }

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
