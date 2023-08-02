// Types for serialised filter options for a corpus by the API

export type SearchFilterType = 'DateFilter' | 'MultipleChoiceFilter' | 'RangeFilter' | 'BooleanFilter';

export interface HasDescription {
    description: string;
}

export type DateFilterOptions = {
    name: 'DateFilter';
    lower: string;
    upper: string;
} & HasDescription;

export type MultipleChoiceFilterOptions = {
    name: 'MultipleChoiceFilter';
    option_count: number;
} & HasDescription;

export type RangeFilterOptions = {
    name: 'RangeFilter';
    lower: number;
    upper: number;
} & HasDescription;

export type BooleanFilterOptions = {
    name: 'BooleanFilter';
    checked: boolean;
} & HasDescription;

export type FilterOptions =
    DateFilterOptions |
    MultipleChoiceFilterOptions |
    RangeFilterOptions |
    BooleanFilterOptions;
