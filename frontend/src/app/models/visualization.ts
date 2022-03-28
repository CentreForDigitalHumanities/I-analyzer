import { AggregateResult, DateResult } from '.';
import { SearchFilter, SearchFilterData } from './search-filter';

// the corpusFields has an array of visualizations
// the visualizationField represents one pairing of corpus field + visualization
export type visualizationField = {
    name: string,
    visualization: string,
    displayName?: string,
    visualizationSort?: string,
    searchFilter?: SearchFilter<SearchFilterData> | null,
    multiFields?: string[];
};

// common type between histogram and timeline
export type BarchartResult = DateResult|AggregateResult;

export type BarchartSeries = {
    data: BarchartResult[],
    total_doc_count: number,
    searchRatio: number,
    queryText?: string,
};

export type HistogramSeries = {
    data: AggregateResult[],
    total_doc_count: number,
    searchRatio: number,
    queryText?: string,
};

export type TimelineSeries = {
    data: DateResult[],
    total_doc_count: number,
    searchRatio: number,
    queryText?: string,
};

export type freqTableHeaders = {
    key: string,
    label: string,
    format?: (value) => string|undefined,
}[];

export type histogramOptions = {
    frequencyMeasure: 'documents'|'tokens',
    normalizer: 'raw'|'percent'|'documents'|'terms',
};
