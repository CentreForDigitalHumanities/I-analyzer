import { SearchFilter, SearchFilterData } from './search-filter';

export type visualizationField = {
    name: string,
    visualizationType: string,
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

export type freqTableHeaders = {
    key: string,
    label: string,
    format?: (value) => string
}[];
