// Types for serialised filter options for a corpus by the API

export type FieldFilterType = 'DateFilter' | 'MultipleChoiceFilter' | 'RangeFilter' | 'BooleanFilter';

export interface HasDescription {
    description: string;
}

export type DateFilterOptions = {
    name: 'DateFilter';
    lower: string|null;
    upper: string|null;
} & HasDescription;

export type MultipleChoiceFilterOptions = {
    name: 'MultipleChoiceFilter';
    option_count: number;
} & HasDescription;

export type RangeFilterOptions = {
    name: 'RangeFilter';
    lower: number|null;
    upper: number|null;
} & HasDescription;

export type BooleanFilterOptions = {
    name: 'BooleanFilter';
} & HasDescription;

export type FieldFilterOptions =
    DateFilterOptions |
    MultipleChoiceFilterOptions |
    RangeFilterOptions |
    BooleanFilterOptions;
