import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';

import { SearchFilter, SearchFilterData, CorpusField, QueryModel, searchFilterDataFromSettings, searchFilterDataFromField, contextFilterFromField, Corpus } from '../models';
import { SearchService } from './search.service';

interface SearchFilterSettings {
    [fieldName: string]: SearchFilterData;
}

@Injectable()
export class ParamService {

    constructor(private searchService: SearchService) { }

    /***
     * Utility function to convert field name to string
     */
    public getParamForFieldName(fieldName: string) {
        return `${fieldName}`;
    }

    public queryModelFromParams(params:ParamMap, corpusFields: CorpusField[]) {
        // copy fields so the state in components is isolated
        const fields = _.cloneDeep(corpusFields);
        const activeFilters = this.setFiltersFromParams(params, fields);
        const highlight = this.setHighlightFromParams(params);
        const query = this.setQueryFromParams(params);
        const queryFields = this.setSearchFieldsFromParams(params);
        const sortSettings = this.setSortFromParams(params, fields);
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

    //------- set filters from params  ----//

    /**
     * Set the filter data from the query parameters and return whether any filters were actually set.
     */
    setFiltersFromParams(params: ParamMap, corpusFields: CorpusField[]): SearchFilter<SearchFilterData>[] {
        const filterSettings = this.filterSettingsFromParams(params, corpusFields);
        return this.applyFilterSettings(filterSettings, corpusFields);
    }

    filterSettingsFromParams(params: ParamMap, corpusFields: CorpusField[]): SearchFilterSettings {
        const settings = {};
        corpusFields.forEach(field => {
            const param = this.getParamForFieldName(field.name);
            if (params.has(param)) {
                let filterSettings = params.get(param).split(',');
                if (filterSettings[0] === '') { filterSettings = []; }
                const filterType = field.searchFilter ? field.searchFilter.currentData.filterType : undefined;
                const data = searchFilterDataFromSettings(filterType, filterSettings, field);
                settings[field.name] = data;
            }
        });

        return settings;
    }

    applyFilterSettings(filterSettings: SearchFilterSettings, corpusFields: CorpusField[]) {
        corpusFields.forEach(field => {
            if (_.has(filterSettings, field.name)) {
                let searchFilter = field.searchFilter || contextFilterFromField(field);
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
    }

    // --- set params from filters --- //

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

    // --- sort params --- //

    setSortFromParams(params: ParamMap, corpusFields: CorpusField[]): {field: CorpusField, ascending: boolean} {
        let sortField: CorpusField;
        let sortAscending = true;
        if (params.has('sort')) {
            const [sortParam, ascParam] = params.get('sort').split(',');
            sortAscending = ascParam === 'asc';
            if ( sortParam === 'relevance' ) {
                return {
                    field: undefined,
                    ascending: sortAscending
                }
            }
            sortField = corpusFields.find(field => field.name === sortParam);
        } else {
            sortField = corpusFields.find(field => field.primarySort);
        }
        return {
            field: sortField,
            ascending: sortAscending
        };
    }

    makeSortParams(sortField: CorpusField, direction: string): {sort: string} {
        const fieldName = sortField !== undefined ? sortField.name : 'relevance'
        return {sort:`${fieldName},${direction}`};
    }

    // --- set query fields, highlight and query text from params --- //

    setSearchFieldsFromParams(params: ParamMap): string[] | null {
        if (params.has('fields')) {
            const selectedSearchFields = params.get('fields').split(',');
            return selectedSearchFields;
        }
    }

    setHighlightFromParams(params: ParamMap): number {
        return Number(params.get('highlight'));
    }

    setQueryFromParams(params: ParamMap): string {
        return params.get('query');
    }

    setCaptionFromParams(params:ParamMap, corpus: Corpus): string[] {
        let output = [`Searched corpus: ${corpus.name}`];
        const query = params.get('query');
        if (query) {
            output.push(`Query: ${query}`);
        }
        const fields = params.get('fields')
        if (fields) {
            output.push(`Searched in fields: ${fields}`);
        }
        const fieldNames = corpus.fields.map(f => f.name);
        const filters = _.intersection(fieldNames, params.keys);
        if (filters.length) {
            const filterInformation = filters.map(
                filter => `${filter}=${decodeURIComponent(params.get(filter))}`
            );
            output.push(`Search filters: ${filterInformation.join('&')}`);
        }
        const visualizationOptions = _.difference(params.keys, ['query', 'fields', ...fieldNames]);
        if (visualizationOptions.length) {
            const visualizationSettings = visualizationOptions.map(option => `${option}=${params.get(option)}`);
            output.push(`Visualization options: ${visualizationSettings.join('&')}`);
        }
        return output
    }

}
