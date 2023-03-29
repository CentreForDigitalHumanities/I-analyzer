/* eslint-disable @typescript-eslint/naming-convention */

import * as _ from 'lodash';
import { BooleanQuery, Corpus, CorpusField, EsFilter, EsSearchClause, MatchAll, SimpleQueryString } from '../models';
import { sortDirectionFromBoolean } from './sort';


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


export const makeSortSpecification = (sortBy: string, sortAscending: boolean) => {
    if (!sortBy) {
        return {};
    } else {
        const sortByField = {
            [sortBy]: sortDirectionFromBoolean(sortAscending)
        };
        return {
            sort: [sortByField]
        };
    }
};

export const makeHighlightSpecification = (corpusFields: CorpusField[], queryText?: string, highlightSize?: number) => {
    if (!queryText || !highlightSize) {
        return {};
    }
    const highlightFields = corpusFields.filter(field => field.searchable);
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

