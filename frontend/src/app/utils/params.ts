import { ParamMap, Params, convertToParamMap } from '@angular/router';
import * as _ from 'lodash';
import { Corpus, CorpusField, FilterInterface, QueryModel, SearchFilter, SortBy, SortDirection, SortState } from '../models';
import { TagFilter } from '../models/tag-filter';
import { PageResultsParameters } from '../models/page-results';
import { findByName } from './utils';

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

export const highlightToParams = (highlight?: number): { highlight: string | null } => {
    if (_.isUndefined(highlight)) {
        return { highlight: null };
    }

    return { highlight: highlight.toString() };
};

export const highlightFromParams = (params: Params): number =>
    Number(params['highlight']) || undefined;

// sort

export const sortSettingsToParams = (sortBy: SortBy, direction: SortDirection, corpus: Corpus): {sort: string|null} => {
    if (_.isEqual([sortBy, direction], corpus.defaultSort)) {
        return { sort: null };
    }

    let sortByName: string;
    if (!sortBy) {
        sortByName = 'relevance';
    } else {
        sortByName = sortBy.name;
    }
    return { sort: `${sortByName},${direction}` };
};

export const sortSettingsFromParams = (params: Params|undefined, corpus: Corpus): SortState => {
    if (params && !params['sort']) {
        return corpus.defaultSort;
    } else {
        const [sortParam, ascParam] = params['sort'].split(',');

        let sortBy: SortBy;

        if ( sortParam === 'relevance' ) {
            sortBy = undefined;
        } else {
            sortBy = findByName(corpus.fields, sortParam);
        }

        const sortDirection: SortDirection = ascParam;
        return [sortBy, sortDirection];
    }
};

// filters

export const filtersFromParams = (params: ParamMap, corpus: Corpus): FilterInterface[] => {
    const fieldFilters = fieldFiltersFromParams(params, corpus);
    const tagFilter = tagFilterFromParams(params);
    return [...fieldFilters, tagFilter];
};

const fieldFiltersFromParams = (params: ParamMap, corpus: Corpus): SearchFilter[] => {
    const specifiedFields = corpus.fields.filter(field => params.has(field.name));
    return specifiedFields.map(field => {
        const filter = field.makeSearchFilter();
        filter.setFromParams(params);
        return filter;
    });
};

const tagFilterFromParams = (params: ParamMap): TagFilter => {
    const filter = new TagFilter();
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

export const pageResultsParametersToParams = (state: PageResultsParameters, corpus: Corpus): Params => {
    const sort = sortSettingsToParams(...state.sort, corpus);
    const highlight = highlightToParams(state.highlight);
    return {...sort, ...highlight};
};

export const pageResultsParametersFromParams = (params: Params, corpus: Corpus): Partial<PageResultsParameters> => ({
    sort: sortSettingsFromParams(params, corpus),
    highlight: highlightFromParams(params),
});
