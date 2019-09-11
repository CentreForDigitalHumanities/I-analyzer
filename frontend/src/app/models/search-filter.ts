import { AggregateResult } from './search-results';

export type SearchFilter = {
    fieldName: string,
    description: string,
    useAsFilter: boolean,
    defaultData?: SearchFilterData,
    currentData: SearchFilterData
}

export type SearchFilterData = BooleanFilterData | MultipleChoiceFilterData | RangeFilterData | DateFilterData;

export type BooleanFilterData = { 
    filterType: 'BooleanFilter', 
    checked: boolean
};
export type MultipleChoiceFilterData = {
    filterType: 'MultipleChoiceFilter', 
    options?: string[], 
    selected: string[],
    optionsAndCounts?: AggregateResult[]
};
export type RangeFilterData = {
    filterType: 'RangeFilter',
    min: number, 
    max: number 
};
export type DateFilterData = {
    filterType: 'DateFilter',
    /** minimum of date range, format: yyyy-MM-dd */
    min: string,
    /** maximum of date range, format: yyyy-MM-dd */
    max: string
};

export type SearchFilterType = SearchFilterData["filterType"];
