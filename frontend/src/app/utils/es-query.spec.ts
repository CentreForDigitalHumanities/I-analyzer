/* eslint-disable @typescript-eslint/naming-convention */
import { mockCorpus3, mockField, mockField2 } from '../../mock-data/corpus';
import { makeHighlightSpecification, makeSimpleQueryString, makeSortSpecification } from './es-query';

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
