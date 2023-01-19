import { CorpusField } from "./corpus";

export type SearchFilter<T extends SearchFilterData> = {
    fieldName: string,
    description: string,
    useAsFilter: boolean,
    reset?: boolean,
    grayedOut?: boolean,
    adHoc?: boolean,
    defaultData?: T,
    currentData: T
}

export type SearchFilterData = BooleanFilterData | MultipleChoiceFilterData | RangeFilterData | DateFilterData;

export type BooleanFilterData = {
    filterType: 'BooleanFilter',
    checked: boolean
};
export type MultipleChoiceFilterData = {
    filterType: 'MultipleChoiceFilter',
    optionCount?: number,
    selected: string[]
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

export function searchFilterDataFromSettings(filterType: SearchFilterType|undefined, value: string[], field: CorpusField): SearchFilterData {
    switch (filterType) {
        case "BooleanFilter":
            return { filterType, checked: value[0] === 'true' };
        case "MultipleChoiceFilter":
            return { filterType, selected: value };
        case "RangeFilter": {
            let [min, max] = parseMinMax(value);
            return { filterType, min: parseFloat(min), max: parseFloat(max) };
        }
        case "DateFilter": {
            let [min, max] = parseMinMax(value);
            return { filterType, min: min, max: max };
        }
        case undefined: {
            return searchFilterDataFromField(field, value);
        }
    }
}

export function searchFilterDataFromField(field: CorpusField, value: string[]): SearchFilterData {
    switch (field.mappingType) {
        case 'boolean':
            return { filterType: 'BooleanFilter', checked: value[0] === 'true' };
        case 'date': {
            let [min, max] = parseMinMax(value);
            return { filterType: 'DateFilter', min: min, max: max };
        }
        case 'integer': {
            let [min, max] = parseMinMax(value);
            return { filterType: 'RangeFilter', min: parseFloat(min), max: parseFloat(max) };
        }
        case 'keyword': {
            return { filterType: 'MultipleChoiceFilter', selected: value.map(encodeURIComponent) };
        }
    }
}

function parseMinMax(value: string[]): [string, string] {
    const term = value[0];
    if (term.split(':').length === 2) {
        return term.split(':') as [string, string];
    } else if (value.length == 1) {
        return [term, term];
    } else {
        return [value[0], value[1]];
    }
}

export function contextFilterFromField(field: CorpusField): SearchFilter<SearchFilterData> {
    return {
        fieldName: field.name,
        description: `Search only within this ${field.displayName}`,
        useAsFilter: true,
        adHoc: true,
        currentData: undefined,
    };
}
