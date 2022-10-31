import { AggregateResult, DateResult } from '.';
import { SearchFilter, SearchFilterData } from './search-filter';

// common type for all histogram/timeline results
export type BarchartResult = DateResult|AggregateResult;

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

export type freqTableHeader = {
    key: string,
    label: string,
    format?: (value) => string,
    formatDownload?: (value) => string,
    isOptional?: boolean,
    isMainFactor?: boolean,
    isSecondaryFactor?: boolean,
};

export type freqTableHeaders = freqTableHeader[];

export type Normalizer = 'raw'|'percent'|'documents'|'terms';

export type NgramParameters = {
    size: number,
    positions: number[],
    freqCompensation: boolean,
    analysis: string,
    maxDocuments: number,
    numberOfNgrams: number,
    dateField: string,
};
