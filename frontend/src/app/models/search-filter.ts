import { CorpusField } from './corpus';

export interface SearchFilter<T extends SearchFilterData> {
    fieldName: string;
    description: string;
    useAsFilter: boolean;
    reset?: boolean;
    grayedOut?: boolean;
    adHoc?: boolean;
    defaultData?: T;
    currentData: T;
};

export type SearchFilterData = BooleanFilterData | MultipleChoiceFilterData | RangeFilterData | DateFilterData;

export interface BooleanFilterData {
    filterType: 'BooleanFilter';
    checked: boolean;
}
export interface MultipleChoiceFilterData {
    filterType: 'MultipleChoiceFilter';
    optionCount?: number;
    selected: string[];
}
export interface RangeFilterData {
    filterType: 'RangeFilter';
    min: number;
    max: number;
}
export interface DateFilterData {
    filterType: 'DateFilter';
    /** minimum of date range, format: yyyy-MM-dd */
    min: string;
    /** maximum of date range, format: yyyy-MM-dd */
    max: string;
}

export type SearchFilterType = SearchFilterData['filterType'];

export const searchFilterDataToParam = (filter: SearchFilter<SearchFilterData>): string | string[] => {
    switch (filter.currentData.filterType) {
        case 'BooleanFilter':
            return `${filter.currentData.checked}`;
        case 'MultipleChoiceFilter':
            return filter.currentData.selected as string[];
        case 'RangeFilter':
            return `${filter.currentData.min}:${filter.currentData.max}`;
        case 'DateFilter':
            return `${filter.currentData.min}:${filter.currentData.max}`;
    }
};

export const searchFilterDataFromParam = (
    filterType: SearchFilterType|undefined, value: string[], field: CorpusField): SearchFilterData => {
    switch (filterType) {
        case 'BooleanFilter':
            return { filterType, checked: value[0] === 'true' };
        case 'MultipleChoiceFilter':
            return { filterType, selected: value };
        case 'RangeFilter': {
            const [min, max] = parseMinMax(value);
            return { filterType, min: parseFloat(min), max: parseFloat(max) };
        }
        case 'DateFilter': {
            const [min, max] = parseMinMax(value);
            return { filterType, min, max };
        }
        case undefined: {
            return searchFilterDataFromField(field, value);
        }
    }
};

export const searchFilterDataFromField = (field: CorpusField, value: string[]): SearchFilterData => {
    switch (field.mappingType) {
        case 'boolean':
            return { filterType: 'BooleanFilter', checked: value[0] === 'true' };
        case 'date': {
            const [min, max] = parseMinMax(value);
            return { filterType: 'DateFilter', min, max };
        }
        case 'integer': {
            const [min, max] = parseMinMax(value);
            return { filterType: 'RangeFilter', min: parseFloat(min), max: parseFloat(max) };
        }
        case 'keyword': {
            return { filterType: 'MultipleChoiceFilter', selected: value.map(encodeURIComponent) };
        }
    }
};

const parseMinMax = (value: string[]): [string, string] => {
    const term = value[0];
    if (term.split(':').length === 2) {
        return term.split(':') as [string, string];
    } else if (value.length === 1) {
        return [term, term];
    } else {
        return [value[0], value[1]];
    }
};

export const adHocFilterFromField = (field: CorpusField): SearchFilter<SearchFilterData> => ({
    fieldName: field.name,
    description: `Search only within this ${field.displayName}`,
    useAsFilter: true,
    adHoc: true,
    currentData: undefined,
});
