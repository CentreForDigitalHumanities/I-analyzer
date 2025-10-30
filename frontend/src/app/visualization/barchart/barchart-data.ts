import { BarchartSeries, CorpusField, HistogramDataPoint, QueryModel, TaskResult, TermFrequencyResult, TimelineDataPoint } from '@models';
import { DateHistogramResult, TermsResult } from '@models/aggregation';

import { ComparedQueries } from '@models/compared-queries';
import { ApiService, SearchService, VisualizationService } from '@services';
import _ from 'lodash';
import { hasPrefixTerm, mainContentFields } from './query-utils';
import { BehaviorSubject, map, Observable, skip, Subject, takeUntil, withLatestFrom } from 'rxjs';
import { showLoading } from '@utils/utils';

export type FrequencyMeasure = 'documents' | 'tokens';

const documentLimitBase = 10000;
const documentLimitPrefixQueries = 1000;


export abstract class BarchartData<
    AggregateResult extends TermsResult | DateHistogramResult,
    DataPoint extends TimelineDataPoint | HistogramDataPoint
> {
    // rawData: a list of series
    rawData$ = new BehaviorSubject<BarchartSeries<DataPoint>[]>([]);
    documentLimitExceeded = false; // whether the results include documents than the limit
    dataHasLoaded: boolean;

    tasksToCancel: string[];

    loading$ = new BehaviorSubject<boolean>(false);
    error$ = new Subject<string>();
    stopPolling$ = new Subject<void>();

    totalTokenCountAvailable$ = this.rawData$.pipe(
        map(this.checkTotalTokenCount)
    );

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
        ).subscribe(this.refresh.bind(this));
        this.comparedQueries.comparedQueries$.pipe(
            skip(1),
            withLatestFrom(this.comparedQueries.allQueries$),
            map(([compared, all]) => all),
            takeUntil(this.destroy$),
        ).subscribe(this.updateQueries.bind(this));
        this.destroy$.subscribe(() => this.complete());
    }

    get documentLimit(): number {
        return hasPrefixTerm(this.queryModel.queryText) ? documentLimitPrefixQueries : documentLimitBase;
    }

    /** Complete observables */
    complete() {
        this.rawData$.complete();
        this.stopPolling$.next();
        this.stopPolling$.complete();
        this.error$.complete();
        this.loading$.complete();
    }

    /** Create a new data object and fetch results */
    protected refresh() {
        this.initSeries();
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

    /**
     * Get term frequency data for a data series
     *
     * Makes initial request for the series, polls result, merges frequency data with the
     * series object.

    * @param series data series with document counts already filled in
     * @param queryModel user query
     * @returns promise of the series with term frequencies added
     */
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
     * Calculate the maximum number of documents to read through in a bin
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

    /** Adapt query model to fit series: use correct search fields and query text */
    protected queryModelForSeries(
        series: BarchartSeries<DataPoint>,
        queryModel: QueryModel
    ) {
        return this.selectSearchFields(
            this.setQueryText(queryModel, series.queryText)
        );
    }

    /** Create new data object with empty frequencies */
    private initSeries(): void {
        const series = [
            this.newSeries(this.queryModel.queryText),
            ...this.comparedQueries.state$.value.compare.map(this.newSeries)
        ];
        this.rawData$.next(series)
    }

    /** Update the data object to add/remove data series. If a query was already
     * present, results are preserved. Starts loading results for new series.
     */
    private updateQueries(queries: string[]) {
        const data = queries.map((queryText) => {
            const existingSeries = this.rawData$.value.find(
                (series) => series.queryText === queryText
            );
            return existingSeries || this.newSeries(queryText);
        });
        this.rawData$.next(data);
        this.loadData();
    }

    /** Make a blank series object, without frequencies */
    private newSeries(queryText: string): BarchartSeries<DataPoint> {
        return {
            queryText,
            data: [],
            total_doc_count: 0,
            searchRatio: 1.0,
        };
    }

    /** Overarching function to load frequency data */
    private loadData(): Promise<void> {
        const dataPromises = this.requestDocumentData().then(
            this.frequencyMeasure === 'tokens'
                ? this.requestTermFrequencyData.bind(this)
                : _.identity
        ).then((rawData) => {
                this.rawData$.next(rawData);

                if (!rawData.length) {
                    this.error$.next('No results');
                };
            });
        return showLoading(this.loading$, dataPromises);
    }

    /** Request document frequencies for all series, if they are not
     * already filled in.
     */
    private requestDocumentData(): Promise<BarchartSeries<DataPoint>[]> {
        const dataPromises = this.rawData$.value.map((series) => {
            // retrieve data if it was not already loaded
            if (!series.data.length) {
                return this.getSeriesDocumentData(series);
            } else {
                return series;
            }
        });
        return Promise.all(dataPromises).then(
            this.checkDocumentLimitExceeded.bind(this)
        );
    }

    /** Fetch term frequencies for all data series, if they are not already filled
     * in.
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

    /**
     * Return a copy of the query model with the right search fields selected.
     */
    private selectSearchFields(queryModel: QueryModel): QueryModel {
        if (this.frequencyMeasure === 'documents') {
            return queryModel;
        } else {
            const searchFields = mainContentFields(queryModel);
            const queryModelCopy = queryModel.clone();
            queryModelCopy.setParams({ searchFields });
            return queryModelCopy;
        }
    }

    /** Return a copy of a query model with the query text set to the given value */
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

    /** Total document count for a data array */
    private totalDocCount(data: AggregateResult[]) {
        return _.sumBy(data, (item) => item.doc_count);
    }

    /** Fill in the `relative_doc_count` property for an array of datapoints.
     */
    private includeRelativeDocCount(data: DataPoint[], total: number): DataPoint[] {
        return data.map((item) => ({
            ...item,
            relative_doc_count: item.doc_count / total,
        }));
    }

    private onFailure(error: { message: string }) {
        this.error$.next(error.message);
    }

    /** Update a data series in place with term frequency results. Also set
     * `dataHasLoaded` to true.
     */
    private processSeriesTermFrequency(
        results: TermFrequencyResult[], series: BarchartSeries<DataPoint>
    ): BarchartSeries<DataPoint> {
        this.dataHasLoaded = true;
        series.data = _.zip(series.data, results).map(pair => {
            const [bin, res] = pair;
            return this.addTermFrequencyToCategory(res, bin);
        });
        return series;
    };

    /**
     * Add term frequency data to a DataPoint object
     *
     * @param result output from request for term frequencies
     * @param cat DataPoint object where the data should be added
     */
    private addTermFrequencyToCategory(
        data: TermFrequencyResult, cat: DataPoint
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

    /** Whether total token counts are included in the data (which would enable
     * normalisation)
     */
    private checkTotalTokenCount(data: BarchartSeries<DataPoint>[]): boolean {
        return data.find((series) =>
            series.data.find((cat) => cat.token_count !== undefined)
        ) !== undefined;
    }

    /** Make request for the full term frequency data, rather than a sample */
    abstract fullDataRequest(): Promise<TaskResult>;

    /** Request doc counts for a series */
    protected abstract requestSeriesDocCounts(
        queryModel: QueryModel
    ): Promise<AggregateResult[]>;

    /** Request term frequency counts for a series */
    protected abstract requestSeriesTermFrequency(series: BarchartSeries<DataPoint>, queryModel: QueryModel): Promise<TaskResult>;

    /** convert the output of an aggregation search to the relevant result type */
    protected abstract aggregateResultToDataPoint(cat: AggregateResult): DataPoint;


}
