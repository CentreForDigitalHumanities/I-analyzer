import { ParamMap } from '@angular/router';
import * as _ from 'lodash';
import { Corpus, CorpusField, QueryModel, SearchFilter, SortBy, SortDirection } from '../models';

/** omit keys that mapp to null */
export const omitNullParameters = (params: {[key: string]: any}): {[key: string]: any} => {
    const nullKeys = _.keys(params).filter(key => params[key] === null);
    return _.omit(params, nullKeys);
};

export const queryFromParams = (params: ParamMap): string =>
    params.get('query');

export const searchFieldsFromParams = (params: ParamMap, corpus: Corpus): CorpusField[] => {
    if (params.has('fields')) {
        const fieldNames = params.get('fields').split(',');
        return corpus.fields.filter(field => fieldNames.includes(field.name));
    }
};

export const highlightFromParams = (params: ParamMap): number =>
    Number(params.get('highlight'));

// sort

export const sortSettingsToParams = (sortBy: SortBy, direction: SortDirection): {sort: string|null} => {
    let sortByName: string;
    if (!sortBy) {
        sortByName = 'relevance';
    } else {
        sortByName = sortBy.name;
    }
    return { sort: `${sortByName},${direction}` };
};

// filters

export const filtersFromParams = (params: ParamMap, corpus: Corpus): SearchFilter[] => {
    const specifiedFields = corpus.fields.filter(field => params.has(field.name));
    return specifiedFields.map(field => {
        const filter = field.makeSearchFilter();
        const data = filter.dataFromString(params.get(field.name));
        filter.data.next(data);
        return filter;
    });
};

const filterParamForField = (queryModel: QueryModel, field: CorpusField) => {
    const filter = queryModel.filterForField(field);
    if (filter) {
        return filter.toRouteParam();
    } else {
        return { [field.name]: null };
    }
};

export const queryFiltersToParams = (queryModel: QueryModel) => {
    const filterParamsPerField = queryModel.corpus.fields.map(
        field => filterParamForField(queryModel, field));
    return _.reduce(
        filterParamsPerField,
        _.merge,
        {}
    );
};
