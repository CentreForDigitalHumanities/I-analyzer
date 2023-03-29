/* eslint-disable @typescript-eslint/naming-convention */
import { mockField2 } from '../../mock-data/corpus';
import { makeSimpleQueryString } from './es-query';

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
});
