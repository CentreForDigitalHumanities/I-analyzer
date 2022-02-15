import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ChartOptions } from 'chart.js';
import { Corpus, freqTableHeaders, QueryModel, visualizationField, WordSimilarity } from '../models';

import { DialogService, SearchService } from '../services/index';
@Component({
    selector: 'ia-related-words',
    templateUrl: './related-words.component.html',
    styleUrls: ['./related-words.component.scss']
})
export class RelatedWordsComponent implements OnChanges {
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() asTable: boolean;

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
        { key: 'similarity', label: 'Similarity' }
    ];
    tableData: [WordSimilarity];

    public zoomedInData; // data requested when clicking on a time interval
    // colour-blind friendly colorPalette retrieved from colorbrewer2.org
    public colorPalette = ['#a6611a', '#dfc27d', '#80cdc1', '#018571', '#543005', '#bf812d', '#f6e8c3', '#c7eae5', '#35978f', '#003c30']
    public chartOptions: ChartOptions = {
        elements: {
            line: {
                tension: 0, // disables bezier curves
            }
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
        this.searchService.getRelatedWords(this.queryModel.queryText, this.corpus.name).then(results => {
            this.graphData = results['graphData'];
            this.graphData.datasets.map((d, index) => {
                d.fill = false;
                d.borderColor = this.colorPalette[index];
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

    showRelatedWordsDocumentation() {
        this.dialogService.showManualPage('relatedwords');
    }

    zoomTimeInterval(event: any) {
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
                        d.backgroundColor = this.colorPalette[index];
                    })
                // hide grid lines as we only have one data point on x axis
                this.chartOptions.scales.xAxis = {
                    grid: {
                        display: false
                    }
                };
                this.isLoading.emit(false);
            })
            .catch(error => {
                this.error.emit(error['message']);
            });
    }

    zoomBack() {
        this.zoomedInData = null;
        this.chartOptions.scales.xAxis = {};
    }

}
