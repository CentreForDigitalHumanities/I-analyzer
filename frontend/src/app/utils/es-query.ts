/* eslint-disable @typescript-eslint/naming-convention */
// conversion from query model -> elasticsearch query language

import * as _ from 'lodash';
import { CorpusField, MatchAll, SimpleQueryString } from '../models';

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
