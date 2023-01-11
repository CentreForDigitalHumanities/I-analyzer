import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';

import { Corpus, SearchFilter, SearchFilterData, searchFilterDataFromParam, adHocFilterFromField, CorpusField, } from '../models';
import { SearchService } from './search.service';

interface SearchFilterSettings {
    [fieldName: string]: SearchFilterData;
}

@Injectable()
export class ParamService {

    constructor(private searchService: SearchService) { }

    /**
     * Set the filter data from the query parameters and return whether any filters were actually set.
     */
    setFiltersFromParams(searchFilters: SearchFilter<SearchFilterData>[], params: ParamMap, corpus: Corpus) {
        const filterSettings = this.filterSettingsFromParams(params, corpus);
        return this.applyFilterSettings(searchFilters, filterSettings, corpus);
    }

    filterSettingsFromParams(params: ParamMap, corpus: Corpus): SearchFilterSettings {
        const settings = {};
        corpus.fields.forEach(field => {
            const param = this.searchService.getParamForFieldName(field.name);
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

    applyFilterSettings(searchFilters: SearchFilter<SearchFilterData>[], filterSettings: SearchFilterSettings, corpus: Corpus): SearchFilter<SearchFilterData>[] {
        this.setAdHocFilters(searchFilters, filterSettings, corpus);

        searchFilters.forEach(f => {
            if (_.has(filterSettings, f.fieldName)) {
                // if (this.showFilters === undefined) {
                //     this.showFilters = true;
                // }
                const data = filterSettings[f.fieldName];
                f.currentData = data;
                f.useAsFilter = true;
            } else {
                f.useAsFilter = false;
            }
        });
        return searchFilters.filter( f => f.useAsFilter );
    }

    setAdHocFilters(searchFilters: SearchFilter<SearchFilterData>[], filterSettings: SearchFilterSettings, corpus: Corpus) {
        corpus.fields.forEach(field => {
            if (_.has(filterSettings, field.name) && !searchFilters.find(filter => filter.fieldName ===  field.name)) {
                const adHocFilter = adHocFilterFromField(field);
                searchFilters.push(adHocFilter);
            }
        });
    }

    setSortFromParams(corpusFields: CorpusField[], params: ParamMap): {field: CorpusField | string, ascending: boolean} {
        let sortField: CorpusField | string;
        let sortAscending: boolean;
        if (params.has('sort')) {
            const [sortParam, ascParam] = params.get('sort').split(',');
            sortField = corpusFields.find(field => field.name === sortParam);
            sortAscending = ascParam === 'asc';
        } else {
            if (params.get('query')) {
                sortField = undefined;
            } else {
                sortField = 'default';
            }
        }
        return {
            field: sortField,
            ascending: sortAscending
        };
    }

}
