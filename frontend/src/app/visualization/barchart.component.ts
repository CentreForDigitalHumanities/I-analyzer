import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import * as _ from 'lodash';

import { SearchService, DialogService } from '../services/index';
import { Chart, ChartOptions } from 'chart.js';
import { BarchartSeriesRaw, Corpus, freqTableHeaders, histogramOptions, QueryModel } from '../models';
import { zoom } from 'chartjs-plugin-zoom';
import { BehaviorSubject } from 'rxjs';

const hintSeenSessionStorageKey = 'hasSeenTimelineZoomingHint';
const hintHidingMinDelay = 500;       // milliseconds
const hintHidingDebounceTime = 1000;  // milliseconds


@Component({
    selector: 'ia-barchart',
    templateUrl: './barchart.component.html',
    styleUrls: ['./barchart.component.scss']
})

export class BarChartComponent<RawDataSeries extends BarchartSeriesRaw> implements OnInit {
    public showHint: boolean;

    rawData: RawDataSeries[];
    chart: any;

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

    queries: string[] = [];

    valueKeys = {
        tokens: {
            raw: 'match_count',
            terms: 'matches_by_token_count',
            documents: 'matches_by_doc_count',
        },
        documents: {
            raw: 'doc_count',
            percent: 'relative_doc_count',
        }
    };

    @Output() isLoading = new BehaviorSubject<boolean>(false);
    @Output() error = new EventEmitter();

    public colorPalette = ['#3F51B5', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499', '#DDDDDD'];

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
                    onZoom: ({chart}) => this.zoomIn(chart),
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

    ngOnInit() {
        this.setupZoomHint();
    }

    onOptionChange(options: histogramOptions) {
        this.frequencyMeasure = options.frequencyMeasure;
        this.normalizer = options.normalizer;

        if (this.rawData && this.chart) {
            this.prepareChart();
        }
    }

    addSeries(queryText: string) {
        this.rawData.push(this.newSeries(queryText));
        this.setQueries();
        this.prepareChart();
    }

    clearAddedQueries() {
        this.rawData = this.rawData.slice(0, 1);
        this.setQueries();
        this.prepareChart();
    }


    setQueries() {
        if (this.rawData) {
            this.queries = this.rawData.map(series => series.queryText);
        } else {
            this.queries = [];
        }
    }

    prepareChart() {
        this.showLoading(
            this.loadData()
        );
    }

    async showLoading(promise) {
        this.isLoading.next(true);
        await promise;
        this.isLoading.next(false);
    }

    // implemented on child components
    async loadData() { }


    /**
     * Show the zooming hint once per session, hide automatically with a delay
     * when the user moves the mouse.
     */
     setupZoomHint() {
        if (!sessionStorage.getItem(hintSeenSessionStorageKey)) {
            sessionStorage.setItem(hintSeenSessionStorageKey, 'true');
            this.showHint = true;
            const hider = _.debounce(() => {
                this.showHint = false;
                document.body.removeEventListener('mousemove', hider);
            }, hintHidingDebounceTime);
            _.delay(() => {
                document.body.addEventListener('mousemove', hider);
            }, hintHidingMinDelay);
        }
    }


    // specified in timeline
    zoomIn(chart) {}

    showHistogramDocumentation() {
        this.dialogService.showManualPage('histogram');
    }

    newSeries(queryText: string): any {
        return {
            queryText: queryText,
            data: [],
            total_doc_count: 0,
            searchRatio: 1.0,
        };
    }

    get formatValue(): (value?: number) => string|undefined {
        if (this.normalizer === 'percent') {
            return (value?: number) => {
                if (value !== undefined) {
                    return `${_.round(100 * value, 1)}%`;
                }
            };
        } else {
            return (value: number) => {
                if (value !== undefined) {
                    return value.toString();
                }
            };
        }
    }

    setQueryText(query: QueryModel, queryText: string): QueryModel {
        const queryModelCopy = _.cloneDeep(query);
        queryModelCopy.queryText = queryText;
        return queryModelCopy;
    }

    totalDocCount(data: any[]) {
        return _.sumBy(data, item => item.doc_count);
    }

    setTableData() {
        if (this.rawData && this.rawData.length) {
            this.tableData = _.flatMap(this.rawData, series =>
                series.data.map(item => {
                    const result = _.cloneDeep(item) as any;
                    result.queryText = series.queryText;
                    return result;
                })
            );
        }
    }

    get currentValueKey(): string {
        return this.valueKeys[this.frequencyMeasure][this.normalizer];
    }


    get percentageDocumentsSearched() {
        return _.round(100 *  _.max(this.rawData.map(series => series.searchRatio)));
    }

}
