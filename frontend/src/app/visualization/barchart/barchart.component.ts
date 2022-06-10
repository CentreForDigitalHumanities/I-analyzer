import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';

import * as _ from 'lodash';

import { SearchService, DialogService } from '../../services/index';
import { Chart, ChartOptions } from 'chart.js';
import { AggregateResult, BarchartResult, Corpus, freqTableHeaders, QueryModel } from '../../models';
import Zoom from 'chartjs-plugin-zoom';
import { BehaviorSubject } from 'rxjs';
import { selectColor } from '../select-color';

const hintSeenSessionStorageKey = 'hasSeenTimelineZoomingHint';
const hintHidingMinDelay = 500;       // milliseconds
const hintHidingDebounceTime = 1000;  // milliseconds


@Component({
    selector: 'ia-barchart',
    templateUrl: './barchart.component.html',
    styleUrls: ['./barchart.component.scss']
})

/** The barchartComponent is used to define shared functionality between the
 * histogram and timeline components. It does not function as a stand-alone component. */
export class BarChartComponent<Result extends BarchartResult> implements OnInit {
    public showHint: boolean;

    /**
     * Template for a series, used for typedefs: don't store data here.
     * Each dataseries defines its own query text
     * and sores results for that query.
     * `data` contains the results per bin on the x-axis.
     * Elements of `data` are often called cat/category in the code.
     */
    private seriesType: {
        data: Result[],
        total_doc_count: number, // total documents matching the query across the series
        searchRatio: number, // ratio of total_doc_count that can be searched through without exceeding documentLimit
        queryText?: string, // replaces the text in this.queryModel when searching
    };

    // rawData: a list of series
    rawData: (typeof this.seriesType)[];

    // chart object
    chart: Chart;

    @Input() corpus: Corpus;
    @Input() queryModel: QueryModel;
    @Input() visualizedField;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Input() frequencyMeasure: 'documents'|'tokens' = 'documents';
    normalizer: 'raw' | 'percent' | 'documents'|'terms' = 'raw';

    @Input() documentLimit = 1000; // maximum number of documents to search through for term frequency
    documentLimitExceeded = false; // whether the results include documents than the limit
    totalTokenCountAvailable: boolean; // whether the data includes token count totals

    // table data
    tableHeaders: freqTableHeaders;
    tableData: any[];

    /** list of query used by each series in te graph */
    queries: string[] = [];

    /** Stores the key that can be used in a Result object
     * to retrieve the y-axis value.
     * Key can be retrieved as
     * `valueKeys[frequencyMeasure][normalizer]`
     */
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
        interaction: {
            axis: 'x',
        },
        plugins: {
            legend: {
                display: false,
            },
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

    constructor(public searchService: SearchService) {
        const chartDefault = Chart.defaults;
        chartDefault.elements.bar.backgroundColor = selectColor();
        chartDefault.elements.bar.hoverBackgroundColor = selectColor();
        chartDefault.plugins.tooltip.displayColors = false;
        chartDefault.plugins.tooltip.intersect = false;
    }

    ngOnInit() {
        this.setupZoomHint();
    }

    /** check whether input changes should force reloading the data */
    changesRequireRefresh(changes: SimpleChanges): boolean {
        return (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;
    }

    /** update graph after changes to the normalisation menu (i.e. normalizer) */
    onOptionChange(normalizer: 'raw'|'percent'|'documents'|'terms') {
        this.normalizer = normalizer;

        if (this.rawData && this.chart) {
            this.prepareChart();
        }
    }

    /** add a new series (i.e. a new query) to the graph. */
    addSeries(queryText: string) {
        this.rawData.push(this.newSeries(queryText));
        this.setQueries();
        this.prepareChart();
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

    /** Remove any additional queries from the barchartOptions component.
     * Only keep the original query */
    clearAddedQueries() {
        this.rawData = this.rawData.slice(0, 1);
        this.setQueries();
        this.prepareChart();
    }

    /** set the value of the `queries` property based on `rawData`.
     * Queries is used by the barchartOptions component.
     */
    setQueries() {
        if (this.rawData) {
            this.queries = this.rawData.map(series => series.queryText);
        } else {
            this.queries = [];
        }
    }

    /** Show a loading spinner and load data for the graph.
     * This function should be called after (potential) changes to parameters.
     */
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

    /** load data for the graph (if needed), update the graph and freqtable. */
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

    /** Retrieve all document frequencies and store in `rawData`.
     * Document frequencies are only loaded if they are not already in the data. */
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

    /** convert the output of an aggregation search to the relevant result type */
    aggregateResultToResult(cat: AggregateResult): Result {
        return cat as Result;
    }

    /** fill in the `relative_doc_count` property for an array of datapoints.
     */
    includeRelativeDocCount(data: Result[], total: number): Result[] {
        return data.map(item => {
            const result = _.clone(item);
            result.relative_doc_count = result.doc_count / total;
            return result;
        });
    }

    /**
     * Check whether any series found more documents than the document limit.
     * This means that not all documents will be read when counting term frequency.
    */
     checkDocumentLimitExceeded(): void {
        this.documentLimitExceeded = this.rawData.find(series => series.searchRatio < 1) !== undefined;
    }


    /** Retrieve all term frequencies and store in `rawData`.
     * Term frequencies are only loaded if they were not already there.
     */
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
        const totalTokenCountAvailable = this.rawData.find(series => series.data.find(cat => cat.token_count)) !== undefined;
        if (this.frequencyMeasure === 'tokens' && totalTokenCountAvailable && !this.totalTokenCountAvailable) {
            this.normalizer = 'terms';
        }
        this.totalTokenCountAvailable = totalTokenCountAvailable;
    }

    /** total document count for a data array */
    totalDocCount(data: Result[]) {
        return _.sumBy(data, item => item.doc_count);
    }

    /**
     * calculate the maximum number of documents to read through in a bin
     * when determining term frequency.
     */
     documentLimitForCategory(cat: Result, series: (typeof this.seriesType)): number {
        return _.min([10000, _.ceil(cat.doc_count * series.searchRatio)]);
    }


    /**
     * add term frequency data to a Result object
     * @param result output from request for term frequencies
     * @param cat Result object where the data should be added
     */
    addTermFrequencyToCategory(result: {data?: AggregateResult}, cat: Result): void {
        const data = result.data;
        cat.match_count = data.match_count;
        cat.total_doc_count = data.doc_count;
        cat.token_count = data.token_count;
        cat.matches_by_doc_count = data.match_count / data.doc_count,
        cat.matches_by_token_count = data.token_count ? data.match_count / data.token_count : undefined;
    }

    // implemented on child components

    /** Retrieve doc counts for a series */
    requestSeriesDocumentData(series: typeof this.seriesType): Promise<typeof this.seriesType> {
        return undefined;
    }
    /**
     * retrieve term frequencies for a bin and store in `rawData`
     * @param cat the Result object of one bin/category in one series of the data.
     * @param catIndex the index of the bin/category in the series.
     * @param series the series object that the bin/category belongs to.
     * @returns a Promise object, finishes when the frequencies have been inserted into the result.
     */
    requestCategoryTermFrequencyData(cat: Result, catIndex: number, series: typeof this.seriesType): Promise<void> {
        return undefined;
    }
    /** update or initialise chart (should be ran after updates to `rawData`) */
    setChart(): void {
        if (this.chart) {
            this.updateChartData();
        } else {
            this.initChart();
        }
    }
    /** select the columns/headers for the frequency table */
    setTableHeaders(): void { }
    /** code to be executed when zooming in, or when parameters are updated while zoomed in */
    onZoomIn(chart, triggeredByDataUpdate = false) { }
    /** options for the chart.
     * @param datasets array of dataset objects for the chart
     */
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

    /** After updating `rawData`, this executes the update in the chart. */
    updateChartData() {
        const labels = this.getLabels();
        const datasets = this.getDatasets();
        this.chart.data.labels = labels;
        this.chart.data.datasets = datasets;
        this.chart.options.plugins.legend.display = datasets.length > 1;
        this.chart.update();
    }

    /** Return x-axis labels for the chartJS dataset.
     * Can be left undefined depending on data format.
     */
    getLabels(): string[] {
        return undefined;
    }

    /** return chartJS dataset objects based on rawData */
    getDatasets(): any[] {
        return undefined;
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

    /** based on current parameters, get a formatting function for y-axis values */
    get formatValue(): (value?: number) => string|undefined {
        if (this.normalizer === 'percent') {
            return (value?: number) => {
                if (value !== undefined && value !== null) {
                    return `${_.round(100 * value, 1)}%`;
                }
            };
        } else {
            return (value: number) => {
                if (value !== undefined && value !== null) {
                    return value.toString();
                }
            };
        }
    }

    get formatDownloadValue(): (value: number) => string {
        if (this.normalizer === 'percent') {
            return (value: number) => {
                return `${_.round(100 * value, 1)}`;
            };
        } else {
            return (value: number) => value.toString();
        }
    }

    /** return a copy of a query model with the query text set to the given value */
    setQueryText(query: QueryModel, queryText: string): QueryModel {
        const queryModelCopy = _.cloneDeep(query);
        queryModelCopy.queryText = queryText;
        return queryModelCopy;
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
