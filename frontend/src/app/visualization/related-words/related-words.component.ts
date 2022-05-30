import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ChartOptions } from 'chart.js';
import { Corpus, freqTableHeaders, QueryModel, visualizationField, WordSimilarity } from '../../models';
import { selectColor } from '../select-color';
import { DialogService, SearchService } from '../../services/index';

@Component({
    selector: 'ia-related-words',
    templateUrl: './related-words.component.html',
    styleUrls: ['./related-words.component.scss']
})
export class RelatedWordsComponent implements OnChanges {
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
            borderColor?: string
        }[]
    };

    tableHeaders: freqTableHeaders = [
        { key: 'key', label: 'Term' },
        { key: 'similarity', label: 'Similarity', format: this.formatValue }
    ];
    tableData: [WordSimilarity];

    public zoomedInData; // data requested when clicking on a time interval
    public chartOptions: ChartOptions = {
        elements: {
            line: {
                tension: 0, // disables bezier curves
            },
        },
        scales: {
            xAxis: {},
            yAxis: {
                title: {
                    display: true,
                    text: 'Cosine similarity (SVD_PPMI)'
                }
            },
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    boxHeight: 0, // flat boxes so the border is a line
                }
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

    constructor(private dialogService: DialogService, private searchService: SearchService) { }

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
            });

            this.tableData = results['tableData'];
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

}
