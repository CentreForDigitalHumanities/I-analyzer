/* eslint-disable @typescript-eslint/naming-convention */

import * as _ from 'lodash';
import { BooleanQuery, Corpus, CorpusField, EsFilter, EsSearchClause, MatchAll, SimpleQueryString, SortDirection } from '../models';
import { EsQuery } from '../services';

// conversion from query model -> elasticsearch query language

export const matchAll: MatchAll = {
    match_all: {}
};

export const makeSimpleQueryString = (queryText: string, searchFields?: CorpusField[]): SimpleQueryString => {
    const clause: SimpleQueryString = {
        simple_query_string: {
            query: queryText,
            lenient: true,
            default_operator: 'or'
        }
    };
    if (searchFields) {
        const fieldNames = searchFields.map(field => field.name);
        _.set(clause, 'simple_query_string.fields', fieldNames);
    }
    return clause;
};

export const makeEsSearchClause = (queryText?: string, searchFields?: CorpusField[]): EsSearchClause => {
    if (queryText) {
        return makeSimpleQueryString(queryText, searchFields);
    } else {
        return matchAll;
    }
};

export const makeBooleanQuery = (query: EsSearchClause, filters: EsFilter[]): BooleanQuery => ({
    bool: {
        must: query,
        filter: filters,
    }
});

export const combineSearchClauseAndFilters = (searchClause: EsSearchClause, filters?: EsFilter[]): EsQuery => {
    const query = (filters && filters.length) ? makeBooleanQuery(searchClause, filters) : searchClause;
    return { query };
};

export const makeSortSpecification = (sortBy: CorpusField|'relevance', sortDirection: SortDirection) => {
    if (sortBy === 'relevance') {
        return {};
    } else {
        const sortByField = {
            [sortBy.name]: sortDirection
        };
        return {
            sort: [sortByField]
        };
    }
};

export const makeHighlightSpecification = (corpus: Corpus, queryText?: string, highlightSize?: number) => {
    if (!queryText || !highlightSize) {
        return {};
    }
    const highlightFields = corpus.fields.filter(field => field.searchable);
    return {
        highlight: {
            fragment_size: highlightSize,
            pre_tags: ['<span class="highlight">'],
            post_tags: ['</span>'],
            order: 'score',
            fields: highlightFields.map(field => ({
                [field.name]: { }
            }))
        }
    };
};

