import { Component, EventEmitter, Input, Output } from '@angular/core';

import * as _ from 'lodash';

import { SearchService, DialogService } from '../services/index';
import { Chart, ChartOptions } from 'chart.js';
import { Corpus, QueryModel } from '../models';

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
    @Output() error = new EventEmitter();

    public primaryColor = '#3F51B5';

    basicChartOptions: ChartOptions = { // chart options not suitable for Chart.defaults.global
        scales: {
            xAxes: [{
                id: 'xAxis',
                scaleLabel: { display: true, labelString: '' },
                gridLines: { drawBorder: true, drawOnChartArea: false }
            }],
            yAxes: [{
                id: 'yAxis',
                type: 'linear',
                scaleLabel: { display: true, labelString: 'Frequency' },
                gridLines: { drawBorder: true, drawOnChartArea: false, },
                ticks: {
                    beginAtZero: true,
                    callback: (value, index, values) => this.formatValue(value as number),
                }
            }]
        },
        plugins: {
            zoom: {
                zoom: {
                    onZoom: ({chart}) => this.loadZoomedInData(chart),
                    onZoomComplete: ({chart}) => this.setYmaxOnZoom(chart)
                }
            }
        }
    };

    constructor(public searchService: SearchService, public dialogService: DialogService) {
        const chartDefault = Chart.defaults.global;
        chartDefault.legend.display = false;
        chartDefault.tooltips.displayColors = false;
        chartDefault.tooltips.intersect = false;

        const zoomDefault = chartDefault.plugins.zoom.zoom;
        zoomDefault.enabled = true;
        zoomDefault.drag = true;
        zoomDefault.mode = 'x';
        zoomDefault.threshold = 0;
        zoomDefault.sensitivity = 0;
    }

    loadZoomedInData(chart) {}

    setYmaxOnZoom(chart) {
        let maxValue: number;
        if (chart.scales.xAxis.type === 'category') { // histogram
            const ticks = chart.scales.xAxis.ticks as string[];
            const zoomedInData = chart.data.datasets[0].data
                .filter((item, index) =>
                    ticks.includes(chart.data.labels[index])
                );
            maxValue = _.max(zoomedInData);
        } else { // timeline
            const minDate = new Date(chart.scales.xAxis.options.ticks.min);
            const maxDate = new Date(chart.scales.xAxis.options.ticks.max);
            const zoomedInData = chart.data.datasets[0].data
                .filter((item: {t: Date}) => item.t >= minDate && item.t <= maxDate);
            maxValue = _.max(zoomedInData.map(item => item.y));
        }

        chart.scales.yAxis.options.ticks.max = maxValue;
        chart.update();
    }

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
