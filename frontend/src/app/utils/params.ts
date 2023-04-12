import { ParamMap } from '@angular/router';
import * as _ from 'lodash';
import { contextFilterFromField, CorpusField, SearchFilter, SearchFilterData, searchFilterDataFromSettings } from '../models';
import { findByName } from './utils';

/** omit keys that mapp to null */
export const omitNullParameters = (params: {[key: string]: any}): {[key: string]: any} => {
    const nullKeys = _.keys(params).filter(key => params[key] === null);
    return _.omit(params, nullKeys);
};

export const queryFromParams = (params: ParamMap): string =>
    params.get('query');

export const searchFieldsFromParams = (params: ParamMap): string[] | null => {
    if (params.has('fields')) {
        const selectedSearchFields = params.get('fields').split(',');
        return selectedSearchFields;
    }
};

export const highlightFromParams = (params: ParamMap): number =>
    Number(params.get('highlight'));

// sort

export const sortSettingsToParams = (sortBy: CorpusField, direction: string): {sort: string} => {
    const fieldName = sortBy !== undefined ? sortBy.name : 'relevance';
    return {sort:`${fieldName},${direction}`};
};

export const sortSettingsFromParams = (params: ParamMap, corpusFields: CorpusField[]): {field: CorpusField; ascending: boolean} => {
    let sortField: CorpusField;
    let sortAscending = true;
    if (params.has('sort')) {
        const [sortParam, ascParam] = params.get('sort').split(',');
        sortAscending = ascParam === 'asc';
        if ( sortParam === 'relevance' ) {
            return {
                field: undefined,
                ascending: sortAscending
            };
        }
        sortField = findByName(corpusFields, sortParam);
    } else {
        sortField = corpusFields.find(field => field.primarySort);
    }
    return {
        field: sortField,
        ascending: sortAscending
    };
};


interface SearchFilterSettings {
    [fieldName: string]: SearchFilterData;
}

/**
 * Set the filter data from the query parameters and return whether any filters were actually set.
 */
export const filtersFromParams = (params: ParamMap, corpusFields: CorpusField[]): SearchFilter<SearchFilterData>[] => {
    const filterSettings = filterSettingsFromParams(params, corpusFields);
    return applyFilterSettings(filterSettings, corpusFields);
};

const filterSettingsFromParams = (params: ParamMap, corpusFields: CorpusField[]): SearchFilterSettings => {
    const settings = {};
    corpusFields.forEach(field => {
        const param = paramForFieldName(field.name);
        if (params.has(param)) {
            let filterSettings = params.get(param).split(',');
            if (filterSettings[0] === '') {
                filterSettings = [];
            }
            const filterType = field.searchFilter ? field.searchFilter.currentData.filterType : undefined;
            const data = searchFilterDataFromSettings(filterType, filterSettings, field);
            settings[field.name] = data;
        }
    });

    return settings;
};

const applyFilterSettings = (filterSettings: SearchFilterSettings, corpusFields: CorpusField[]) => {
    corpusFields.forEach(field => {
        if (_.has(filterSettings, field.name)) {
            const searchFilter = field.searchFilter || contextFilterFromField(field);
            const data = filterSettings[field.name];
            searchFilter.currentData = data;
            searchFilter.useAsFilter = true;
            field.searchFilter = searchFilter;
        } else {
            if (field.searchFilter) {
                field.searchFilter.useAsFilter = false;
                if (field.searchFilter.adHoc) {
                    field.searchFilter = null;
                }
            }
        }
    });

    return corpusFields.filter( field => field.searchFilter && field.searchFilter.useAsFilter ).map( field => field.searchFilter );
};

/***
 * Convert field name to string
 */
export const paramForFieldName = (fieldName: string) =>
    `${fieldName}`;


// --- set params from filters --- //

export const searchFiltersToParams = (fields: CorpusField[]) => {
    const params = {};
    fields.forEach( field => {
        const paramName = paramForFieldName(field.name);
        const value = field.searchFilter.useAsFilter? searchFilterDataToParam(field.searchFilter) : null;
        params[paramName] = value;
    });

    return params;
};

export const searchFilterDataToParam = (filter: SearchFilter<SearchFilterData>): string => {
    switch (filter.currentData.filterType) {
        case 'BooleanFilter':
            return `${filter.currentData.checked}`;
        case 'MultipleChoiceFilter':
            return filter.currentData.selected.join(',');
        case 'RangeFilter':
            return `${filter.currentData.min}:${filter.currentData.max}`;
        case 'DateFilter':
            return `${filter.currentData.min}:${filter.currentData.max}`;
    }
};

