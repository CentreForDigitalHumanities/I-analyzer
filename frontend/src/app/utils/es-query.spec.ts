/* eslint-disable @typescript-eslint/naming-convention */
import { mockField, mockField2, mockField3 } from '../../mock-data/corpus';
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

    });

    it('should make a sort specification', () => {
        expect(makeSortSpecification(undefined, true)).toEqual({});
        expect(makeSortSpecification('great_field', false)).toEqual({
            sort: [{ great_field: 'desc' }]
        });
    });

    it('should make a highlight specification', () => {
        const fields = [mockField2, mockField3];
        expect(makeHighlightSpecification(fields, 'test', undefined)).toEqual({});

        expect(makeHighlightSpecification(fields, 'test', 100)).toEqual({
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
