import { Component, EventEmitter, Input, Output } from '@angular/core';

import * as _ from 'lodash';

import { SearchService, DialogService } from '../services/index';
import { Chart, ChartOptions } from 'chart.js';
import { Corpus, freqTableHeaders, QueryModel } from '../models';
import { zoom } from 'chartjs-plugin-zoom';

@Component({
    selector: 'ia-barchart',
    templateUrl: './barchart.component.html',
    styleUrls: ['./barchart.component.scss']
})

export class BarChartComponent {
    @Input() corpus: Corpus;
    @Input() queryModel: QueryModel;
    @Input() visualizedField;
    @Input() asTable: boolean;

    frequencyMeasure: 'documents'|'tokens' = 'documents';
    normalizer: 'raw' | 'percent' | 'documents'|'terms' = 'raw';

    @Input() documentLimit = 1000; // maximum number of documents to search through for term frequency
    documentLimitExceeded = false; // whether the results include documents than the limit
    totalTokenCountAvailable: boolean; // whether the data includes token count totals

    tableHeaders: freqTableHeaders;
    tableData: any[];

    @Output() isLoading = new EventEmitter<boolean>();
    @Output() error = new EventEmitter();

    public colorPalette = ['#3F51B5', '#88CCEE', '#44AA99', '#117733', '#332288', '#DDCC77', '#999933', '#CC6677', '#882255', '#AA4499', '#DDDDDD'];

    basicChartOptions: ChartOptions = { // chart options not suitable for Chart.defaults.global
        scales: {
            xAxis: {
                title: { display: true },
                grid: { drawBorder: true, drawOnChartArea: false }
            },
            yAxis: {
                type: 'linear',
                beginAtZero: true,
                title: { display: true, text: 'Frequency' },
                grid: { drawBorder: true, drawOnChartArea: false, },
                ticks: {
                    callback: (value, index, values) => this.formatValue(value as number),
                },
                min: 0,
            }
        },
        plugins: {
            zoom: {
                zoom: {
                    mode: 'x',
                    drag: {
                        enabled: true,
                        threshold: 0,
                    },
                    pinch: {
                        enabled: false,
                    },
                    wheel: {
                        enabled: false,
                    },
                    onZoom: ({chart}) => this.loadZoomedInData(chart),
                }
            }
        }
    };

    constructor(public searchService: SearchService, public dialogService: DialogService) {
        const chartDefault = Chart.defaults;
        chartDefault.elements.bar.backgroundColor = this.colorPalette[0];
        chartDefault.elements.bar.hoverBackgroundColor = this.colorPalette[0];
        chartDefault.interaction.axis = 'x';
        chartDefault.plugins.legend.display = false;
        chartDefault.plugins.tooltip.displayColors = false;
        chartDefault.plugins.tooltip.intersect = false;
    }

    // specified in timeline
    loadZoomedInData(chart) {}

    showHistogramDocumentation() {
        this.dialogService.showManualPage('histogram');
    }

    newSeries(queryText: string) {
        return {
            queryText: queryText,
            data: [],
            total_doc_count: 0,
            searchRatio: 1.0,
        };
    }

    get formatValue(): (value: number) => string {
        if (this.normalizer === 'percent') {
            return (value: number) => {
                return `${_.round(100 * value, 1)}%`;
            };
        } else {
            return (value: number) => value.toString();
        }
    }
}
