import { ParamMap } from '@angular/router';
import * as _ from 'lodash';
import { Corpus, CorpusField, FilterInterface, QueryModel, SearchFilter, SortBy, SortDirection } from '../models';
import { TagService } from '../services/tag.service';
import { TagFilter } from '../models/tag-filter';

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

// highlight

export const highlightToParams = (queryModel: QueryModel): { highlight: string | null } => {
    if (queryModel.highlightDisabled || !queryModel.highlightSize) {
        return { highlight: null };
    }

    return { highlight: queryModel.highlightSize.toString() };
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

export const filtersFromParams = (params: ParamMap, corpus: Corpus, tagService?: TagService): FilterInterface[] => {
    const fieldFilters = fieldFiltersFromParams(params, corpus);
    const tagFilter = tagService ? [tagFilterFromParams(params, tagService)] : [];
    return [...fieldFilters, ...tagFilter];
};

const fieldFiltersFromParams = (params: ParamMap, corpus: Corpus): SearchFilter[] => {
    const specifiedFields = corpus.fields.filter(field => params.has(field.name));
    return specifiedFields.map(field => {
        const filter = field.makeSearchFilter();
        filter.setFromParams(params);
        return filter;
    });
};

const tagFilterFromParams = (params: ParamMap, tagService: TagService): TagFilter => {
    const filter = new TagFilter(tagService);
    filter.setFromParams(params);
    return filter;
};

export const queryFiltersToParams = (queryModel: QueryModel) => {
    const filterParamsPerField = queryModel.filters.map(filter =>
        filter.toRouteParam()
    );
    return _.reduce(
        filterParamsPerField,
        _.merge,
        {}
    );
};

export const paramsHaveChanged = (queryModel: QueryModel, newParams: ParamMap) => {
    const currentParams = queryModel.toRouteParam();

    return _.some( _.keys(currentParams), key =>
        newParams.get(key) !== currentParams[key]
    );
};
