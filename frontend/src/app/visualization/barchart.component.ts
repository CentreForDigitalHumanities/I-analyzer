import { Component, EventEmitter, Input, Output } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Axis from 'd3-axis';
import * as d3Format from 'd3-format';
import * as d3Brush from 'd3-brush';
import * as _ from 'lodash';

import { SearchService, DialogService } from '../services/index';
import { ChartOptions } from 'chart.js';
import { AggregateResult, Corpus, DateResult, HistogramDataPoint, QueryModel, TimelineDataPoint } from '../models';

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
    searchRatioDocuments: number; // ratio of documents that can be search without exceeding documentLimit
    documentLimitExceeded = false; // whether the results include documents than the limit
    totalTokenCountAvailable: boolean; // whether the data includes token count totals

    @Output() isLoading = new EventEmitter<boolean>();

    public xDomain: Array<any>;
    public primaryColor = '#3F51B5';

    defaultChartOptions: ChartOptions = {
        scales: {
            xAxes: [{
                scaleLabel: { display: true, labelString: '' }
            }],
            yAxes: [{
                scaleLabel: { display: true, labelString: 'Frequency' },
                ticks: {
                    beginAtZero: true,
                    callback: (value, index, values) => this.formatValue(value as number),
                }
            }]
        },
        legend: {
            display: false,
        },
        tooltips: {
            displayColors: false,
        },
        plugins: {
            zoom: {
                zoom: {
                    enabled: true,
                    drag: true,
                    mode: 'x',
                    threshold: 0,
                    sensitivity: 0,
                }
            }
        }
    };

    constructor(public searchService: SearchService, public dialogService: DialogService) { }

    // implemented on child components
    protected zoomOut() { }


    showHistogramDocumentation() {
        this.dialogService.showManualPage('histogram');
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

    get percentageDocumentsSearched() {
        return _.round(100 * this.searchRatioDocuments);
    }

}
