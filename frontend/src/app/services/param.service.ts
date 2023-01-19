import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';

import { SearchFilter, SearchFilterData, searchFilterDataFromParam, CorpusField, QueryModel, } from '../models';
import { SearchService } from './search.service';

interface SearchFilterSettings {
    [fieldName: string]: SearchFilterData;
}

@Injectable()
export class ParamService {

    constructor(private searchService: SearchService) { }

    public getParamForFieldName(fieldName: string) {
        return `${fieldName}`;
    }

    public queryModelFromParams(params:ParamMap, corpusFields: CorpusField[]) {
        const query = params.get('query')
        const highlight = Number(params.get('highlight'));
        // copy fields so
        const fields = _.cloneDeep(corpusFields);
        const sortSettings = this.setSortFromParams(params, fields);
        const activeFilters = this.setFiltersFromParams(params, fields);
        const queryFields = this.setSearchFieldsFromParams(params, fields);
        return this.searchService.createQueryModel(
            query, queryFields, activeFilters, sortSettings.field, sortSettings.ascending, highlight);
    }

    public queryModelToRoute(queryModel: QueryModel, usingDefaultSortField = false, nullableParams = []): any {
        const route = {
            query: queryModel.queryText || ''
        };

        if (queryModel.fields) {
            route['fields'] = queryModel.fields.join(',');
        } else { route['fields'] = null; }

        for (const filter of queryModel.filters.map(data => {
            return {
                param: this.getParamForFieldName(data.fieldName),
                value: this.searchFilterDataToParam(data)
            };
        })) {
            route[filter.param] = filter.value;
        }

        if (!usingDefaultSortField && queryModel.sortBy) {
            route['sort'] = `${queryModel.sortBy},${queryModel.sortAscending ? 'asc' : 'desc'}`;
        } else {
            route['sort'] = null;
        }
        if (queryModel.highlight) {
            route['highlight'] = `${queryModel.highlight}`;
        } else { route['highlight'] = null; }
        if (nullableParams.length) {
            nullableParams.forEach( param => route[param] = null);
        }
        return route;
    }

    /**
     * Set the filter data from the query parameters and return whether any filters were actually set.
     */
    setFiltersFromParams(params: ParamMap, corpusFields: CorpusField[]): SearchFilter<SearchFilterData>[] {
        const filterSettings = this.filterSettingsFromParams(params, corpusFields);
        if ( !Object.keys(filterSettings).length ) {
            return [];
        }
        return this.applyFilterSettings(filterSettings, corpusFields);
    }

    makeFilterParams(fields: CorpusField[]) {
        let params = {};
        fields.forEach( field => {
            const paramName = this.getParamForFieldName(field.name);
            const value = field.searchFilter.useAsFilter? this.searchFilterDataToParam(field.searchFilter) : null;
            params[paramName] = value;
        })

        return params;
    }

    searchFilterDataToParam(filter: SearchFilter<SearchFilterData>): string {
        switch (filter.currentData.filterType) {
            case "BooleanFilter":
                return `${filter.currentData.checked}`;
            case "MultipleChoiceFilter":
                return filter.currentData.selected.join(',')
            case "RangeFilter":
                return `${filter.currentData.min}:${filter.currentData.max}`;
            case "DateFilter":
                return `${filter.currentData.min}:${filter.currentData.max}`;
        }
    }

    filterSettingsFromParams(params: ParamMap, corpusFields: CorpusField[]): SearchFilterSettings {
        const settings = {};
        corpusFields.forEach(field => {
            const param = this.getParamForFieldName(field.name);
            if (params.has(param)) {
                let filterSettings = params.get(param).split(',');
                if (filterSettings[0] === '') { filterSettings = []; }
                const filterType = field.searchFilter ? field.searchFilter.currentData.filterType : undefined;
                const data = searchFilterDataFromParam(filterType, filterSettings, field);
                settings[field.name] = data;
            }
        });

        return settings;
    }

    applyFilterSettings(filterSettings: SearchFilterSettings, corpusFields: CorpusField[]): SearchFilter<SearchFilterData>[] {
        let currentFilters = corpusFields.filter(f => f.searchFilter).map( f => f.searchFilter);
        currentFilters.forEach(f => {
            if (_.has(filterSettings, f.fieldName)) {
                const data = filterSettings[f.fieldName];
                f.currentData = data;
                f.useAsFilter = true;
            } else {
                f.useAsFilter = false;
            }
        });
        return currentFilters.filter( f => f.useAsFilter );
    }

    setSortFromParams(params: ParamMap, corpusFields: CorpusField[]): {field: CorpusField, ascending: boolean} {
        let sortField: CorpusField;
        let sortAscending = true;
        if (params.has('sort')) {
            const [sortParam, ascParam] = params.get('sort').split(',');
            sortField = corpusFields.find(field => field.name === sortParam);
            sortAscending = ascParam === 'asc';
        } else {
            sortField = corpusFields.find(field => field.primarySort);
        }
        return {
            field: sortField,
            ascending: sortAscending
        };
    }

    makeSortParams(sortField: CorpusField, direction: string): {sort: string} {
        const field = sortField.primarySort? null: sortField.name;
        return {sort:`${field},${direction}`};
    }

    setSearchFieldsFromParams(params: ParamMap, corpusFields: CorpusField[]): string[] | null {
        if (params.has('fields')) {
            const selectedSearchFields = params.get('fields').split(',');
            return selectedSearchFields;
        }
    }

}
