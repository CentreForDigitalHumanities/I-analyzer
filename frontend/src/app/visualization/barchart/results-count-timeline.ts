import { BarchartData } from './results-count';
import { BarchartSeries, DateFilterData, QueryModel, TimeCategory, TimelineDataPoint, TimelineSeries } from '@models';
import { DateHistogramAggregator, DateHistogramResult } from '@models/aggregation';
import { differenceInDays } from 'date-fns';

export class TimelineData extends BarchartData<DateHistogramResult, TimelineDataPoint> {
    xDomain: [Date, Date];
    timeCategory: TimeCategory = 'year';

    /** threshold for scaling down a unit on the time scale */
    private scaleDownThreshold = 10;

    zoomedInData (min: Date, max: Date): Promise<BarchartSeries<TimelineDataPoint>[]> {
        const promises = this.rawData$.value.map(series => {
            const queryModelCopy = this.addQueryDateFilter(this.queryModel, min, max);
            return this.getSeriesDocumentData(
                series, queryModelCopy, false
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
            const queryModel = this.queryModelForSeries(series, this.queryModel);
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
                bin, index, series
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
