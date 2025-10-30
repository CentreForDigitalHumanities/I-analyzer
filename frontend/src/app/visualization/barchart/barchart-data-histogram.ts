import { TermsAggregator, TermsResult } from '@models/aggregation';
import { BarchartData } from './barchart-data';
import { HistogramDataPoint, HistogramSeries, MultipleChoiceFilterOptions, QueryModel, RangeFilterOptions, TaskResult } from '@models';
import _ from 'lodash';

export class HistogramData extends BarchartData<TermsResult, HistogramDataPoint> {
    fullDataRequest(): Promise<TaskResult> {
        const paramsPerSeries = this.rawData$.value.map((series) => {
            const queryModel = this.queryModelForSeries(series, this.queryModel);
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
