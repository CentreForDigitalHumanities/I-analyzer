export type SearchFilter<T extends SearchFilterData> = {
    fieldName: string,
    description: string,
    useAsFilter: boolean,
    reset?: boolean,
    grayedOut?: boolean,
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

export function searchFilterDataToParam(filter: SearchFilter<SearchFilterData>): string | string[] {
    switch (filter.currentData.filterType) {
        case "BooleanFilter":
            return `${filter.currentData.checked}`;
        case "MultipleChoiceFilter":
            return filter.currentData.selected as string[];
        case "RangeFilter":
            return `${filter.currentData.min}:${filter.currentData.max}`;
        case "DateFilter":
            return `${filter.currentData.min}:${filter.currentData.max}`;
    }
}

export function searchFilterDataFromParam(filterType: SearchFilterType, value: string[]): SearchFilterData {
    switch (filterType) {
        case "BooleanFilter":
            return { filterType, checked: value[0] === 'true' };
        case "MultipleChoiceFilter":
            return { filterType, selected: value };
        case "RangeFilter": {
            let [min, max] = value[0].split(':');
            return { filterType, min: parseFloat(min), max: parseFloat(max) };
        }
        case "DateFilter": {
            let [min, max] = value[0].split(':');
            return { filterType, min: min, max: max };
        }
    }
}
