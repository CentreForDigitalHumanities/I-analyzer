/* eslint-disable @typescript-eslint/naming-convention */
import * as _ from 'lodash';
import { mockField, mockCorpus3, mockField2 } from '../../mock-data/corpus';
import { makeEsSearchClause, makeHighlightSpecification, makeSimpleQueryString, makeSortSpecification } from './es-query';

describe('es-query utils', () => {
    it('should make a simple query string clause', () => {
        expect(makeSimpleQueryString('test', [mockField2])).toEqual({
            simple_query_string: {
                query: 'test',
                lenient: true,
                default_operator: 'or',
                fields: ['speech']
            }
        });
    });

    it('should set search fields', () => {
        const esQuery = makeEsSearchClause('test', [mockField, mockField2]);
        expect(esQuery['simple_query_string'].fields).toEqual(['great_field', 'speech']);

        const esQuery2 = makeEsSearchClause('test', [mockField2]);
        expect(esQuery2['simple_query_string'].fields).toEqual(['speech']);


        const multifield = _.set(_.clone(mockField), 'multiFields', ['text']);
        const esQuery3 = makeEsSearchClause('test', [multifield, mockField2]);
        expect(esQuery3['simple_query_string'].fields).toEqual(['great_field.text', 'speech']);

    });

    it('should make a sort specification', () => {
        expect(makeSortSpecification('relevance', 'asc')).toEqual({});
        expect(makeSortSpecification(mockField, 'desc')).toEqual({
            sort: [{ great_field: 'desc' }]
        });
    });

    it('should make a highlight specification', () => {
        expect(makeHighlightSpecification(mockCorpus3, 'test', undefined)).toEqual({});

        expect(makeHighlightSpecification(mockCorpus3, 'test', 100)).toEqual({
            highlight: {
                fragment_size: 100,
                pre_tags: ['<span class="highlight">'],
                post_tags: ['</span>'],
                order: 'score',
                fields: [{speech: {}}]
            }
        });
    });
});
