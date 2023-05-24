import { convertToParamMap } from '@angular/router';
import { highlightFromParams, omitNullParameters, searchFieldsFromParams } from './params';
import { mockCorpus3, mockField2 } from '../../mock-data/corpus';

describe('searchFieldsFromParams', () => {
    it('should parse field parameters', () => {
        const params = convertToParamMap({fields: 'speech,great_field'});
        const corpus = mockCorpus3;
        const fields = searchFieldsFromParams(params, corpus);
        expect(fields.length).toEqual(2);
        expect(fields).toContain(mockField2);
    });
});

describe('highlightFromParams', () => {
    it('should parse highlight parameters', () => {
        const params = convertToParamMap({highlight: '100'});
        const highlight = highlightFromParams(params);
        expect(highlight).toBe(100);
    });
});

describe('omitNullParameters', () => {
    it('should omit null parameters', () => {
        const p = { a: null, b: 1, c: 'test' };

        expect(omitNullParameters(p)).toEqual(
            { b: 1, c: 'test' }
        );
    });
});

describe('omitNullParameters', () => {
    it('should omit null parameters', () => {
        const p = { a: null, b: 1, c: 'test' };

        expect(omitNullParameters(p)).toEqual(
            { b: 1, c: 'test' }
        );
    });
});
