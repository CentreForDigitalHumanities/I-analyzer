/* eslint-disable @typescript-eslint/naming-convention */
import * as _ from 'lodash';
import { contentFieldFactory, corpusFactory, dateFieldFactory, keywordFieldFactory } from '../../mock-data/corpus';
import {
    makeEsSearchClause, makeHighlightSpecification, makeSimpleQueryString, makeSortSpecification,
    resultsParamsToAPIQuery
} from './es-query';
import { QueryModel } from '@models';
import { PageResultsParameters } from '@models/page-results';
import { APIQuery } from '@models/search-requests';
import { isTagFilter } from '@models/tag-filter';

describe('es-query utils', () => {
    it('should make a simple query string clause', () => {
        expect(makeSimpleQueryString('test', [contentFieldFactory()])).toEqual({
            simple_query_string: {
                query: 'test',
                lenient: true,
                default_operator: 'or',
                fields: ['content']
            }
        });
    });

    it('should set search fields', () => {
        const contentField = contentFieldFactory();
        const notesField = _.set(contentFieldFactory(), 'name', 'notes');

        const esQuery = makeEsSearchClause('test', [contentField, notesField]);
        expect(esQuery['simple_query_string'].fields).toEqual(['content', 'notes']);

        const esQuery2 = makeEsSearchClause('test', [contentField]);
        expect(esQuery2['simple_query_string'].fields).toEqual(['content']);

        const searchableKeywordField = keywordFieldFactory(true);
        const esQuery3 = makeEsSearchClause('test', [searchableKeywordField, contentField]);
        expect(esQuery3['simple_query_string'].fields).toEqual(['genre.text', 'content']);
    });

    it('should make a sort specification', () => {
        expect(makeSortSpecification(undefined, 'asc')).toEqual({});
        expect(makeSortSpecification(dateFieldFactory(), 'desc')).toEqual({
            sort: [{ date: 'desc' }]
        });
    });

    it('should make a highlight specification', () => {
        expect(makeHighlightSpecification(corpusFactory(), 'test', undefined)).toEqual({});

        expect(makeHighlightSpecification(corpusFactory(), 'test', 100)).toEqual({
            highlight: {
                fragment_size: 100,
                pre_tags: ['<mark class="highlight">'],
                post_tags: ['</mark>'],
                order: 'score',
                fields: [{content: {}}]
            }
        });
    });

    it('should create an API query for paged results', () => {
        const queryModel = new QueryModel(corpusFactory());
        const tagFilter = queryModel.filters.find(isTagFilter);
        tagFilter.set([1]);
        queryModel.setQueryText('test');

        const dateField = queryModel.corpus.fields[2]
        const resultsParams: PageResultsParameters = {
            sort: [dateField, 'desc'],
            from: 0,
            size: 20,
        };

        const expected: APIQuery = {
            es_query: {
                query: {
                    bool: {
                        must: {
                            simple_query_string: {
                                query: 'test',
                                lenient: true,
                                default_operator: 'or',
                            }
                        },
                        filter: [],
                    }
                },
                size: 20,
                from: 0,
                sort: [
                    { date: 'desc'}
                ],
            },
            tags: [1],
        };

        expect(resultsParamsToAPIQuery(queryModel, resultsParams)).toEqual(expected);
    });
});
