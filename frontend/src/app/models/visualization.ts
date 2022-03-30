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

export type HistogramDataPoint = {
    key: string,
    value: number,
};

export type TimelineDataPoint = {
    date: Date,
    value: number,
};

export type freqTableHeader = {
    key: string,
    label: string,
    format?: (value) => string,
    formatDownload?: (value) => string,
}

export type freqTableHeaders = freqTableHeader[];

export type histogramOptions = {
    frequencyMeasure: 'documents'|'tokens',
    normalizer: 'raw'|'percent'|'documents'|'terms',
};
