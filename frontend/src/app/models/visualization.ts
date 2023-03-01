import { AggregateResult, DateResult } from '.';
import { EsQuery, EsQuerySorted } from '../services';

export interface TermFrequencyResult {
    key: string;
    match_count: number;
    token_count?: number;
    total_doc_count: number;
}

export interface HistogramDataPoint {
    key: string;
    doc_count: number;
    relative_doc_count?: number;
    match_count?: number;
    token_count?: number;
    total_doc_count?: number;
    matches_by_token_count?: number;
    matches_by_doc_count?: number;
    key_as_string?: string;
}

export interface TimelineDataPoint {
    date: Date;
    doc_count: number;
    relative_doc_count?: number;
    match_count?: number;
    token_count?: number;
    total_doc_count?: number;
    matches_by_token_count?: number;
    matches_by_doc_count?: number;
}

// common type for all histogram/timeline results
export type BarchartResult = DateResult|AggregateResult;

/**
 * Dataseries for barcharts.
 * Each dataseries defines its own query text
 * and stores results for that query.
 * `data` contains the results per bin on the x-axis.
 * Elements of `data` are often called cat/category in the code.
 */
 export interface BarchartSeries<Result> {
    data: Result[];
    total_doc_count: number; // total documents matching the query across the series
    searchRatio: number; // ratio of total_doc_count that can be searched through without exceeding documentLimit
    queryText?: string; // replaces the text in this.queryModel when searching
}

export type HistogramSeries = BarchartSeries<AggregateResult>;
export type TimelineSeries = BarchartSeries<DateResult>;


export interface TimelineBin {start_date: string; end_date: string; size: number }
export interface HistogramBin {field_value: string|number; size: number }

export type TimeCategory =  'year'|'week'|'month'|'day';

export interface TermFrequencyParameters<Bin> {
    es_query: EsQuery | EsQuerySorted;
    corpus_name: string;
    field_name: string;
    bins: Bin[];
    full_data?: boolean;
    unit?: TimeCategory;
}


export type AggregateTermFrequencyParameters = TermFrequencyParameters<HistogramBin>;
export type DateTermFrequencyParameters = TermFrequencyParameters<TimelineBin>;


export interface WordcloudParameters {
    es_query: EsQuery;
    corpus: string;
    field: string;
    size?: number;
}


export interface FreqTableHeader {
    key: string;
    label: string;
    format?: (value) => string;
    formatDownload?: (value) => string;
    isOptional?: boolean;
    isMainFactor?: boolean;
    isSecondaryFactor?: boolean;
}

export type FreqTableHeaders = FreqTableHeader[];

export type Normalizer = 'raw'|'percent'|'documents'|'terms';

export type ChartType = 'bar' | 'line' | 'scatter';

export interface ChartParameters {
    normalizer: Normalizer;
    chartType: ChartType;
}

export interface NgramParameters {
    size: number;
    positions: string;
    freqCompensation: boolean;
    analysis: string;
    maxDocuments: number;
    numberOfNgrams: number;
    dateField: string;
}

export const ngramSetNull: NgramParameters = {
    size: null,
    positions: null,
    freqCompensation: null,
    analysis: null,
    maxDocuments: null,
    numberOfNgrams: null,
    dateField: null
};

export const barChartSetNull: Object = {
    normalize: null,
    visualizeTerm: null
};
