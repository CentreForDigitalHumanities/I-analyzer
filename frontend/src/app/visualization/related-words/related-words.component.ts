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

    graphData: {
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
            this.graphData = results['graphData'];
            this.graphData.datasets.map((d, index) => {
                d.fill = false;
                d.borderColor = selectColor(this.palette, index);
                d.backgroundColor = selectColor(this.palette, index);
            });

            this.tableData = results['tableData'];
            this.updateChart(this.graphStyle.value);
            this.isLoading.emit(false);
        })
            .catch(error => {
                this.graphData = undefined;
                this.tableData = undefined;
                this.isLoading.emit(false);
                this.error.emit(error);

            });
    }

    zoomTimeInterval(event: any) {
        console.log(event);
        this.isLoading.emit(true);
        this.searchService.getRelatedWordsTimeInterval(
            this.queryModel.queryText,
            this.corpus.name,
            this.graphData.labels[event.element.index])
            .then(results => {
                this.zoomedInData = results['graphData'];
                this.zoomedInData.datasets
                    .sort((a, b) => { return b.data[0] - a.data[0] })
                    .map((d, index) => {
                        d.backgroundColor = selectColor(this.palette, index);
                        d.hoverBackgroundColor = selectColor(this.palette, index);
                    });
                // hide grid lines as we only have one data point on x axis
                this.chartOptions.scales.xAxis = {
                    grid: {
                        display: false
                    }
                };
                this.chartOptions.plugins.legend.labels.boxHeight = undefined;
                this.isLoading.emit(false);
            })
            .catch(error => {
                this.error.emit(error['message']);
            });
    }

    zoomBack() {
        this.zoomedInData = null;
        this.chartOptions.scales.xAxis = {};
        this.chartOptions.plugins.legend.labels.boxHeight = 0;
    }

    formatValue(value: number): string {
        return `${value.toPrecision(3)}`;
    }

    formatDownloadValue(value: number): string {
        return `${value}`;
    }

    dataIndices(data: typeof this.graphData): number[] {
        return _.range(data.labels.length);
    }

    addZeroSeries(data: typeof this.graphData): typeof this.graphData {
        const indices = this.dataIndices(data);

        data.datasets.unshift(
            {
                label: '',
                data: indices.map(() => 0)
            }
        );

        return data;
    }


    stackData(data: typeof this.graphData): typeof this.graphData {
        const indices = this.dataIndices(data);

        const stackedDatasets = data.datasets.map((dataset, datasetIndex) => {
            if (datasetIndex > 0) {
                const newDataset = _.cloneDeep(dataset);
                const values = indices.map(index =>
                    _.sumBy(data.datasets.slice(0, datasetIndex + 1), d => d.data[index])
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

    fixMean(data: typeof this.graphData): typeof this.graphData {
        const indices = this.dataIndices(data);

        const means = indices.map(index =>
            _.meanBy(data.datasets, dataset => dataset.data[index])
        );

        const transformedDatasets = data.datasets.map(dataset => {
            const clone = _.clone(dataset);
            clone.data = indices.map(index => dataset.data[index] - means[index]);
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
    transformStream(data: typeof this.graphData): ChartData {
        const transformations = [this.stackData, this.addZeroSeries, this.fixMean];
        const newData = _.reduce(transformations, (d, transformation) => transformation.bind(this)(d), data);
        return newData;
    }

    updateChart(style: 'line'|'stream'|'bar'): void {
        let data = _.cloneDeep(style === 'bar' ? this.zoomedInData : this.graphData);

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
