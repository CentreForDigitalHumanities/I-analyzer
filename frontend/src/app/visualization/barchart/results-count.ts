import { BarchartSeries, CorpusField, DateFilterData, HistogramDataPoint, HistogramSeries, MultipleChoiceFilterOptions, QueryModel, RangeFilterOptions, TaskResult, TermFrequencyResult, TimeCategory, TimelineDataPoint, TimelineSeries } from '@models';
import { DateHistogramAggregator, DateHistogramResult, TermsAggregator, TermsResult } from '@models/aggregation';

import { ComparedQueries } from '@models/compared-queries';
import { ApiService, SearchService, VisualizationService } from '@services';
import _ from 'lodash';
import { hasPrefixTerm } from './query-utils';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { showLoading } from '@utils/utils';
import { differenceInDays } from 'date-fns';

export type FrequencyMeasure = 'documents' | 'tokens';

const documentLimitBase = 10000;
const documentLimitPrefixQueries = 1000;


export abstract class BarchartData<
    AggregateResult extends TermsResult | DateHistogramResult,
    DataPoint extends TimelineDataPoint | HistogramDataPoint
> {
    // rawData: a list of series
    rawData$: BehaviorSubject<BarchartSeries<DataPoint>[]>;
    documentLimitExceeded = false; // whether the results include documents than the limit
    totalTokenCountAvailable: boolean; // whether the data includes token count totals
    dataHasLoaded: boolean;

    tasksToCancel: string[];

    loading$ = new BehaviorSubject<boolean>(false);
    error$ = new Subject<string>();
    stopPolling$ = new Subject<void>();


    constructor(
        protected queryModel: QueryModel,
        private comparedQueries: ComparedQueries,
        public frequencyMeasure: FrequencyMeasure,
        public visualizedField: CorpusField,
        protected searchService: SearchService,
        protected apiService: ApiService,
        protected visualizationService: VisualizationService,
        private destroy$: Observable<any>,
    ) {
        this.refresh();
        this.queryModel.update.pipe(
            takeUntil(this.destroy$)
        ).subscribe(this.loadData.bind(this));
        this.comparedQueries.allQueries$.subscribe(this.updateQueries.bind(this));
        this.destroy$.subscribe(() => this.complete());
    }

    get documentLimit(): number {
        return hasPrefixTerm(this.queryModel.queryText) ? documentLimitPrefixQueries : documentLimitBase;
    }

    complete() {
        this.stopPolling$.next();
        this.stopPolling$.complete();
        this.error$.complete();
    }



    protected refresh() {
        this.initQueries();
        this.loadData();
    }

    /** Request and fill in doc counts for a series */
    protected getSeriesDocumentData(
        series: BarchartSeries<DataPoint>,
        queryModel: QueryModel = this.queryModel,
        setSearchRatio = true
    ): Promise<BarchartSeries<DataPoint>> {
        const queryModelCopy = this.queryModelForSeries(series, queryModel);

        return this.requestSeriesDocCounts(queryModelCopy).then((result) =>
            this.docCountResultIntoSeries(result, series, setSearchRatio)
        );
    }

    protected getTermFrequencies(
        series: BarchartSeries<DataPoint>,
        queryModel: QueryModel
    ): Promise<BarchartSeries<DataPoint>> {
        this.dataHasLoaded = false;
        const queryModelCopy = this.queryModelForSeries(series, queryModel);
        return new Promise((resolve, reject) => {
            this.requestSeriesTermFrequency(series, queryModelCopy).then(response => {
                this.tasksToCancel = response.task_ids;
                const poller$ = this.apiService.pollTasks(this.tasksToCancel, this.stopPolling$);
                poller$.subscribe({
                    error: (error) => {
                        this.onFailure(error);
                        reject(error);
                    },
                    next: (result) => {
                        resolve(this.processSeriesTermFrequency(result['results'], series));
                    },
                    complete: () => {
                        // abort tasks if the Observable is completed via takeUntil
                        if (!this.dataHasLoaded) {
                            this.apiService.abortTasks({ task_ids: this.tasksToCancel });
                        }
                    }
                });
            });
        });
    }

    /**
     * calculate the maximum number of documents to read through in a bin
     * when determining term frequency.
     */
    protected documentLimitForCategory(
        cat: DataPoint,
        series: BarchartSeries<DataPoint>
    ): number {
        return _.min([
            this.documentLimit,
            _.ceil(cat.doc_count * series.searchRatio),
        ]);
    }

    /** adapt query model to fit series: use correct search fields and query text */
    protected queryModelForSeries(
        series: BarchartSeries<DataPoint>,
        queryModel: QueryModel
    ) {
        return this.selectSearchFields(
            this.setQueryText(queryModel, series.queryText)
        );
    }

    private initQueries(): void {
        const series = [
            this.newSeries(this.queryModel.queryText),
            ...this.comparedQueries.state$.value.compare.map(this.newSeries)
        ];
        this.rawData$ = new BehaviorSubject(series);
    }

    /** update the queries in the graph to the input array. Preserve results if possible,
     * and start loading for the rest.
     */
    private updateQueries(queries: string[]) {
        if (this.rawData$) {
            const data = queries.map((queryText) => {
                const existingSeries = this.rawData$.value.find(
                    (series) => series.queryText === queryText
                );
                return existingSeries || this.newSeries(queryText);
            });
            this.rawData$.next(data);
            this.loadData();
        }
    }

    /** make a blank series object */
    private newSeries(queryText: string): BarchartSeries<DataPoint> {
        return {
            queryText,
            data: [],
            total_doc_count: 0,
            searchRatio: 1.0,
        };
    }

    private loadData(): Promise<void> {
        const dataPromises = this.requestDocumentData().then(
                this.frequencyMeasure === 'tokens'
                    ? this.requestTermFrequencyData.bind(this)
                    : _.identity
            )
            .then((rawData) => {
                this.rawData$.next(rawData);

                if (!rawData.length) {
                    this.error$.next('No results');
                };
            });
        return showLoading(this.loading$, dataPromises);
    }

    private requestDocumentData(): Promise<BarchartSeries<DataPoint>[]> {
        const dataPromises = this.rawData$.value.map((series) => {
            if (!series.data.length) {
                // retrieve data if it was not already loaded
                return this.getSeriesDocumentData(series);
            } else {
                return series;
            }
        });
        return Promise.all(dataPromises).then(
            this.checkDocumentLimitExceeded.bind(this)
        );
    }

    /** Retrieve all term frequencies and store in `rawData`.
     * Term frequencies are only loaded if they were not already there.
     */
    private requestTermFrequencyData(rawData: typeof this.rawData$.value): Promise<BarchartSeries<DataPoint>[]> {
        // cancel and stop polling running tasks
        this.stopPolling$.next();
        const dataPromises = rawData.map(series => {
            if (series.queryText && series.data.length && series.data[0].match_count === undefined) {
                // retrieve data if it was not already loaded
                return this.getTermFrequencies(series, this.queryModel);
            } else {
                return series;
            }
        });

        return Promise.all(dataPromises);
    }


    /**
     * Check whether any series found more documents than the document limit.
     * This means that not all documents will be read when counting term frequency.
     */
    private checkDocumentLimitExceeded(
        rawData: typeof this.rawData$.value
    ): typeof this.rawData$.value {
        this.documentLimitExceeded =
            rawData.find((series) => series.searchRatio < 1) !== undefined;
        return rawData;
    }

    private selectSearchFields(queryModel: QueryModel) {
        if (this.frequencyMeasure === 'documents') {
            return queryModel;
        } else {
            const mainContentFields = this.queryModel.corpus.fields.filter(
                (field) =>
                    field.searchable && field.displayType === 'text_content'
            );
            const queryModelCopy = queryModel.clone();
            queryModelCopy.setParams({searchFields: mainContentFields});
            return queryModelCopy;
        }
    }


    /** return a copy of a query model with the query text set to the given value */
    private setQueryText(query: QueryModel, queryText: string): QueryModel {
        const queryModelCopy = query.clone();
        queryModelCopy.setQueryText(queryText);
        return queryModelCopy;
    }

    /**
     * Convert the result from an document search into a data series object.
     * - Converts to the relevant DataPoint type using `aggregateResultToDataPoint`
     * - Adds the total document count and search ratio for retrieving term frequencies.
     * - Adds the relative document count.
     *
     * @param result result from aggregation search
     * @param series series object that this data belongs to
     * @param setSearchRatio whether the search ratio should be reset. Defaults to `true`,
     * may be set to `false` when loading a portion of the series during zoom.
     * @returns a copy of the series with the document counts included.
     */
    private docCountResultIntoSeries(
        result: AggregateResult[],
        series: BarchartSeries<DataPoint>,
        setSearchRatio = true
    ): BarchartSeries<DataPoint> {
        let data = result.map(this.aggregateResultToDataPoint);
        const totalDocCount = this.totalDocCount(result);
        const searchRatio = setSearchRatio
            ? this.documentLimit / totalDocCount
            : series.searchRatio;
        data = this.includeRelativeDocCount(data, totalDocCount);
        return {
            data,
            total_doc_count: totalDocCount,
            searchRatio,
            queryText: series.queryText,
        };
    }

    /** total document count for a data array */
    private totalDocCount(data: AggregateResult[]) {
        return _.sumBy(data, (item) => item.doc_count);
    }

    /** fill in the `relative_doc_count` property for an array of datapoints.
     */
    private includeRelativeDocCount(data: DataPoint[], total: number): DataPoint[] {
        return data.map((item) => {
            const result = _.clone(item);
            result.relative_doc_count = result.doc_count / total;
            return result;
        });
    }

    private onFailure(error) {
        this.error$.next(`could not load results: ${error.message}`);
    }

    private processSeriesTermFrequency(results: TermFrequencyResult[], series: BarchartSeries<DataPoint>): BarchartSeries<DataPoint> {
        this.dataHasLoaded = true;
        series.data = _.zip(series.data, results).map(pair => {
            const [bin, res] = pair;
            return this.addTermFrequencyToCategory(res, bin);
        });
        return series;
    };

    /**
     * add term frequency data to a DataPoint object
     *
     * @param result output from request for term frequencies
     * @param cat DataPoint object where the data should be added
     */
    private addTermFrequencyToCategory(
        data: TermFrequencyResult,
        cat: DataPoint
    ): DataPoint {
        cat.match_count = data.match_count;
        cat.total_doc_count = data.total_doc_count;
        cat.token_count = data.token_count;
        cat.matches_by_doc_count = data.match_count / data.total_doc_count;
        cat.matches_by_token_count = data.token_count
            ? data.match_count / data.token_count
            : undefined;
        return cat;
    }

    abstract fullDataRequest(): Promise<TaskResult>;

    /** Request doc counts for a series */
    protected abstract requestSeriesDocCounts(
        queryModel: QueryModel
    ): Promise<AggregateResult[]>;


    /** convert the output of an aggregation search to the relevant result type */
    protected abstract aggregateResultToDataPoint(cat: AggregateResult): DataPoint;

    protected abstract requestSeriesTermFrequency(series: BarchartSeries<DataPoint>, queryModel: QueryModel): Promise<TaskResult>;

}

export class HistogramData extends BarchartData<TermsResult, HistogramDataPoint> {
    fullDataRequest(): Promise<TaskResult> {
        const paramsPerSeries = this.rawData$.value.map((series) => {
            const queryModel = this.queryModelForSeries(
                series,
                this.queryModel
            );
            const bins = this.makeTermFrequencyBins(series);
            return this.visualizationService.makeAggregateTermFrequencyParameters(
                this.queryModel.corpus,
                queryModel,
                this.visualizedField.name,
                bins
            );
        });
        return this.apiService.requestFullData({
            visualization: 'aggregate_term_frequency',
            parameters: paramsPerSeries,
            corpus_name: this.queryModel.corpus.name,
        });
    }

    /** specify aggregator object based on visualised field;
     * used in document requests.
     */
    protected getAggregator(): TermsAggregator {
        let size = 100;

        const filterOptions = this.visualizedField.filterOptions;
        if (filterOptions?.name === 'MultipleChoiceFilter') {
            size = (filterOptions as MultipleChoiceFilterOptions).option_count;
        } else if (filterOptions?.name === 'RangeFilter') {
            const filterRange =
                (filterOptions as RangeFilterOptions).upper -
                (filterOptions as RangeFilterOptions).lower;
            size = _.max([size, filterRange])
        }
        return new TermsAggregator(this.visualizedField, size);
    }

    protected requestSeriesDocCounts(queryModel: QueryModel) {
        const aggregator = this.getAggregator();
        return this.searchService.aggregateSearch(this.queryModel.corpus, queryModel, aggregator);
    }

    protected aggregateResultToDataPoint(cat: TermsResult) {
        return cat;
    }

    protected requestSeriesTermFrequency(
        series: HistogramSeries,
        queryModel: QueryModel
    ) {
        const bins = this.makeTermFrequencyBins(series);
        return this.visualizationService.aggregateTermFrequencySearch(
            this.queryModel.corpus,
            queryModel,
            this.visualizedField.name,
            bins
        );
    }

    private makeTermFrequencyBins(series: HistogramSeries) {
        return series.data.map((bin) => ({
            fieldValue: bin.key,
            size: this.documentLimitForCategory(bin, series),
        }));
    }
}

export class TimelineData extends BarchartData<DateHistogramResult, TimelineDataPoint> {
    xDomain: [Date, Date];
    timeCategory: TimeCategory = 'year';

    /** threshold for scaling down a unit on the time scale */
    private scaleDownThreshold = 10;

    zoomedInData (min: Date, max: Date): Promise<BarchartSeries<TimelineDataPoint>[]> {
        const promises = this.rawData$.value.map(series => {
            const queryModelCopy = this.addQueryDateFilter(
                this.queryModel,
                min,
                max
            );
            return this.getSeriesDocumentData(
                series,
                queryModelCopy,
                false
            ).then((result) => {
                if (this.frequencyMeasure === 'tokens') {
                    return this.getTermFrequencies(result, queryModelCopy);
                } else {
                    return result;
                }
            });
        });
        return Promise.all(promises);
    }

    fullDataRequest() {
        const paramsPerSeries = this.rawData$.value.map((series) => {
            const queryModel = this.queryModelForSeries(
                series,
                this.queryModel
            );
            const bins = this.makeTermFrequencyBins(series);
            const unit = this.timeCategory;
            return this.visualizationService.makeDateTermFrequencyParameters(
                this.queryModel.corpus,
                queryModel,
                this.visualizedField.name,
                bins,
                unit
            );
        });
        return this.apiService.requestFullData({
            visualization: 'date_term_frequency',
            parameters: paramsPerSeries,
            corpus_name: this.queryModel.corpus.name,
        });
    }


    /**
     * Get the time category (year/month/week/day) that should be used in the graph,
     * based on minimum and maximum dates on the x axis.
     */
    calculateTimeCategory(min: Date, max: Date): TimeCategory {
        const diff = differenceInDays(max, min);
        if (diff <= this.scaleDownThreshold) {
            return 'day';
        } else if (diff <= this.scaleDownThreshold * 7) {
            return 'week';
        } else if (diff <= this.scaleDownThreshold * 30) {
            return 'month';
        } else {
            return 'year';
        }
    }


    protected refresh(): void {
        this.setTimeDomain();
        super.refresh();
    }

    protected aggregateResultToDataPoint(cat: DateHistogramResult): TimelineDataPoint {
    /* date fields are returned with keys containing identifiers by elasticsearch
    replace with string representation, contained in 'key_as_string' field
    */
        return {
            date: new Date(cat.key_as_string),
            doc_count: cat.doc_count,
        };
    }

    /** Retrieve doc counts for a series.
     *
     * @param series series object
     * @param setSearchRatio whether the `searchRatio` property of the series should be updated.
     * True when retrieving results for the entire series, false when retrieving a window.
     */
    protected requestSeriesDocCounts(queryModel: QueryModel) {
        const aggregation = new DateHistogramAggregator(
            this.visualizedField,
            this.timeCategory
        );
        return this.searchService.aggregateSearch(this.queryModel.corpus, queryModel, aggregation);
    }

    protected requestSeriesTermFrequency(series: TimelineSeries, queryModel: QueryModel) {
        const bins = this.makeTermFrequencyBins(series);
        return this.visualizationService.dateTermFrequencySearch(
            this.queryModel.corpus,
            queryModel,
            this.visualizedField.name,
            bins,
            this.timeCategory
        );
    }


    /**
     * Add a date filter to a query model restricting it to the provided min and max values.
     */
    private addQueryDateFilter(query: QueryModel, min: Date, max: Date): QueryModel {
        const queryModelCopy = query.clone();
        // download zoomed in results
        const filter = this.visualizedField.makeSearchFilter();
        filter.set({ min, max });
        queryModelCopy.addFilter(filter);
        return queryModelCopy;
    }

    private makeTermFrequencyBins(series: TimelineSeries) {
        return series.data.map((bin, index) => {
            const [minDate, maxDate] = this.categoryTimeDomain(
                bin,
                index,
                series
            );
            return {
                start_date: minDate,
                end_date: maxDate,
                size: this.documentLimitForCategory(bin, series),
            };
        });
    }

    /** get min/max date for the entire graph and set domain and time category */
    private setTimeDomain() {
        const filter = this.queryModel.filterForField(this.visualizedField)
            || this.visualizedField.makeSearchFilter();
        const currentDomain = filter.currentData as DateFilterData;
        const min = new Date(currentDomain.min);
        const max = new Date(currentDomain.max);
        this.xDomain = [min, max];
        this.timeCategory = this.calculateTimeCategory(min, max);
    }

    /** time domain for a bin */
    private categoryTimeDomain(cat, catIndex, series): [Date, Date] {
        const startDate = cat.date;
        const endDate =
            catIndex < series.data.length - 1
                ? series.data[catIndex + 1].date
                : undefined;
        return [startDate, endDate];
    }

}
