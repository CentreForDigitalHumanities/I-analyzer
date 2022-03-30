import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';

import * as _ from 'lodash';

import { SearchService, DialogService } from '../services/index';
import { Chart, ChartOptions } from 'chart.js';
import { AggregateResult, BarchartResult, Corpus, freqTableHeaders, histogramOptions, QueryModel } from '../models';
import Zoom from 'chartjs-plugin-zoom';
import { BehaviorSubject } from 'rxjs';
import { at } from 'lodash';

const hintSeenSessionStorageKey = 'hasSeenTimelineZoomingHint';
const hintHidingMinDelay = 500;       // milliseconds
const hintHidingDebounceTime = 1000;  // milliseconds


@Component({
    selector: 'ia-barchart',
    templateUrl: './barchart.component.html',
    styleUrls: ['./barchart.component.scss']
})

export class BarChartComponent<Result extends BarchartResult> implements OnInit {
    public showHint: boolean;

    /**
     * template for a series
     * each dataseries defines its own query text
     * and sores results for that query
     * `data` contains the results per bin on the x-axis
     * elements of `data` are often called cat/category in the code
     */
    private seriesType: {
        data: Result[],
        total_doc_count: number, // total documents matching the query across the series
        searchRatio: number, // ratio of total_doc_count that can be searched through without exceeding documentLimit
        queryText?: string, // replaces the text in this.queryModel when searching
    };

    // rawData: a list of series
    rawData: (typeof this.seriesType)[];
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
                    onZoom: ({chart}) => this.onZoomIn(chart),
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

    /** check whether input changes should force reloading the data */
    changesRequireRefresh(changes: SimpleChanges) {
        return (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;
    }

    /** update graph after changes to the option menu (i.e. frequency measure / normalizer) */
    onOptionChange(options: histogramOptions) {
        this.frequencyMeasure = options.frequencyMeasure;
        this.normalizer = options.normalizer;

        if (this.rawData && this.chart) {
            this.prepareChart();
        }
    }

    /** add a series to the graph */
    addSeries(queryText: string) {
        this.rawData.push(this.newSeries(queryText));
        this.setQueries();
        this.prepareChart();
    }

    /** remove any additional queries, only keep the original */
    clearAddedQueries() {
        this.rawData = this.rawData.slice(0, 1);
        this.setQueries();
        this.prepareChart();
    }

    /** set the value of the `queries` property based on `rawData` */
    setQueries() {
        if (this.rawData) {
            this.queries = this.rawData.map(series => series.queryText);
        } else {
            this.queries = [];
        }
    }

    /** load any data needed for the graph and update */
    prepareChart() {
        this.showLoading(
            this.loadData()
        );
    }

    /** execute a process with loading spinner */
    async showLoading(promise) {
        this.isLoading.next(true);
        await promise;
        this.isLoading.next(false);
    }

    /** load data for the graph (if needed) */
    async loadData() {
        // load data if needed
        await this.requestDocumentData();
        if (this.frequencyMeasure === 'tokens') { await this.requestTermFrequencyData(); }

        if (!this.rawData.length) {
            this.error.emit({message: 'No results'});
        }

        // initialise or update chart
        this.setChart();

        // update freqtable
        this.setTableHeaders();
        this.setTableData();

        // load zoomed-in data if needed
        if (this.isZoomedIn) {
            this.onZoomIn(this.chart, true);
        }
    }

    /** retrieve document frequencies and store in `rawData` */
    async requestDocumentData() {
        const dataPromises = this.rawData.map((series, seriesIndex) => {
            if (!series.data.length) { // retrieve data if it was not already loaded
                return this.requestSeriesDocumentData(series).then(result =>
                    this.rawData[seriesIndex] = result
                );
            }
        });

        await Promise.all(dataPromises);
        this.checkDocumentLimitExceeded();
    }

    /** retrieve term frequencies and store in `rawData` */
    async requestTermFrequencyData() {
        const dataPromises = _.flatMap(this.rawData, (series => {
            if (series.queryText && series.data[0].match_count === undefined) { // retrieve data if it was not already loaded
                return series.data.map((cat, index) =>
                    this.requestCategoryTermFrequencyData(cat, index, series)
                );
            }
        }));

        await Promise.all(dataPromises);

        // signal if total token counts are available
        this.totalTokenCountAvailable = this.rawData.find(series => series.data.find(cat => cat.token_count)) !== undefined;
    }

    // implemented on child components

    /** retrieve doc counts for a series */
    requestSeriesDocumentData(series: typeof this.seriesType): Promise<typeof this.seriesType> {
        return undefined;
    }
    /** retrieve term frequencies and store in `rawData` */
    requestCategoryTermFrequencyData(cat: Result, catIndex: number, series: typeof this.seriesType): Promise<any> {
        return undefined;
    }
    /** update or initialise chart (should be ran after updates to `rawData`) */
    setChart(): void { }
    /** select the columns/headers for the frequency table */
    setTableHeaders(): void { }
    /** code to be executed when zooming in, or when data is update while zommed in */
    onZoomIn(chart, triggeredByDataUpdate = false) { }
    /** options for the chart */
    chartOptions(datasets): any {
        return this.basicChartOptions;
    }

    /** initalise a new chart */
    initChart() {
        const labels = this.getLabels();
        const datasets = this.getDatasets();
        const options = this.chartOptions(datasets);
        this.chart = new Chart('barchart',
            {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                plugins: [ Zoom ],
                options: options
            }
        );

        this.chart.canvas.ondblclick = (event) => this.zoomOut();
    }

    /** reset zooming */
    zoomOut(): void {
        this.chart.resetZoom();
    }

    updateChartData() {
        const labels = this.getLabels();
        const datasets = this.getDatasets();
        this.chart.labels = labels;
        this.chart.data.datasets = datasets;
        this.chart.options.plugins.legend.display = datasets.length > 1;
        this.chart.update();
    }

    /** return x-axis labels */
    getLabels(): string[] {
        return undefined;
    }

    /** return dataset objects based on rawData */
    getDatasets(): any[] {
        return undefined;
    }


    /**
     * Convert the result from an document search into a data series object.
     * - Converts to the relevant Result type using `aggregateResultToResult`
     * - Adds the total document count and search ratio for retrieving term frequencies.
     * - Adds the relative document count.
     * @param result result from aggregation search
     * @param series series object that this data belongs to
     * @param setSearchRatio whether the search ratio should be reset. Defaults to `true`,
     * may be set to `false` when loading a portion of the series during zoom.
     * @returns a copy of the series with the document counts included.
     */
    docCountResultIntoSeries(result, series: (typeof this.seriesType), setSearchRatio = true): (typeof this.seriesType) {
        let data = result.aggregations[this.visualizedField.name]
            .map(this.aggregateResultToResult);
        const total_doc_count = this.totalDocCount(data);
        const searchRatio = setSearchRatio ? this.documentLimit / total_doc_count : series.searchRatio;
        data = this.includeRelativeDocCount(data, total_doc_count);
        return {
            data: data,
            total_doc_count: total_doc_count,
            searchRatio: searchRatio,
            queryText: series.queryText,
        };
    }

    /**
     * Check whether any series found more documents than the document limit.
     * This means that not all documents will be read when counting term frequency.
    */
    checkDocumentLimitExceeded(): void {
        this.documentLimitExceeded = this.rawData.find(series => series.searchRatio < 1) !== undefined;
    }

    /** convert the output of an aggregation search to the relevant result type */
    aggregateResultToResult(cat: AggregateResult): Result {
        return cat as Result;
    }

    /** fill in the `relative_doc_count` property for an array of datapoints */
    includeRelativeDocCount(data: Result[], total: number): Result[] {
        return data.map(item => {
            const result = _.clone(item);
            result.relative_doc_count = result.doc_count / total;
            return result;
        });
    }

    /**
     * add term frequency data to a result object
     * @param result result from request for term frequencies
     * @param cat result object where the data should be added
     */
    addTermFrequencyToCategory(result: {data?: AggregateResult}, cat: Result): void {
        const data = result.data;
        cat.match_count = data.match_count;
        cat.total_doc_count = data.doc_count;
        cat.token_count = data.token_count;
        cat.matches_by_doc_count = data.match_count / data.doc_count,
        cat.matches_by_token_count = data.token_count ? data.match_count / data.token_count : undefined;
    }

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

    /** show documentation page */
    showHistogramDocumentation() {
        this.dialogService.showManualPage('histogram');
    }

    /** make a blank series object */
    newSeries(queryText: string): (typeof this.seriesType) {
        return {
            queryText: queryText,
            data: [],
            total_doc_count: 0,
            searchRatio: 1.0,
        };
    }

    /** based on current parameters, get a formatting function for y-axis values */
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

    /** return a copy of a query model with the query text set to the given value */
    setQueryText(query: QueryModel, queryText: string): QueryModel {
        const queryModelCopy = _.cloneDeep(query);
        queryModelCopy.queryText = queryText;
        return queryModelCopy;
    }

    /** total document count for a data array */
    totalDocCount(data: Result[]) {
        return _.sumBy(data, item => item.doc_count);
    }

    /** assemble the array of table data */
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

    /**
     * calculate the maximum number of documents to read through in a bin
     * when determining term frequency.
     */
    documentLimitForCategory(cat: Result, series: (typeof this.seriesType)): number {
        return _.min([10000, _.ceil(cat.doc_count * series.searchRatio)]);
    }

    /** which key of a Result object should be used as the y-axis value */
    get currentValueKey(): string {
        return this.valueKeys[this.frequencyMeasure][this.normalizer];
    }

    /**
     * Percentage of documents that was actually read when determining term frequency.
     * This differs per series, but user message only gives one value, currently the minimum.
     */
    get percentageDocumentsSearched() {
        return _.round(100 *  _.min(this.rawData.map(series => series.searchRatio)));
    }

    /**
     * Whether the graph is zoomed in on the x-axis.
     */
    get isZoomedIn(): boolean {
        // If no zooming-related scripts are implemented, just return false
        return false;
    }

}
