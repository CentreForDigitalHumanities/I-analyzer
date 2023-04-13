import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';

import { CorpusField, QueryModel } from '../models';
import { SearchService } from './search.service';
import {
    filtersFromParams, highlightFromParams, paramForFieldName, queryFromParams, searchFieldsFromParams,
    searchFilterDataToParam, sortSettingsFromParams
} from '../utils/params';

@Injectable()
export class ParamService {

    constructor(private searchService: SearchService) { }

    public queryModelFromParams(params: ParamMap, corpusFields: CorpusField[]) {
        // copy fields so the state in components is isolated
        const fields = _.cloneDeep(corpusFields);
        const activeFilters = filtersFromParams(params, fields);
        const highlight = highlightFromParams(params);
        const query = queryFromParams(params);
        const queryFields = searchFieldsFromParams(params);
        const sortSettings = sortSettingsFromParams(params, fields);
        return this.searchService.createQueryModel(
            query, queryFields, activeFilters, sortSettings.field, sortSettings.ascending, highlight);
    }

    public queryModelToRoute(queryModel: QueryModel, usingDefaultSortField = false, nullableParams = []): any {
        const route = {
            query: queryModel.queryText || ''
        };

        if (queryModel.fields) {
            route['fields'] = queryModel.fields.join(',');
        } else {
            route['fields'] = null;
        }

        for (const filter of queryModel.filters.map(data => ({
                param: paramForFieldName(data.fieldName),
                value: searchFilterDataToParam(data)
            }))) {
            route[filter.param] = filter.value;
        }

        if (!usingDefaultSortField && queryModel.sortBy) {
            route['sort'] = `${queryModel.sortBy},${queryModel.sortAscending ? 'asc' : 'desc'}`;
        } else {
            route['sort'] = null;
        }

        if (queryModel.highlight) {
            route['highlight'] = `${queryModel.highlight}`;
        } else {
            route['highlight'] = null;
        }

        if (nullableParams.length) {
            nullableParams.forEach( param => route[param] = null);
        }
        return route;
    }

}
