import { convertToParamMap } from '@angular/router';
import { highlightFromParams, omitNullParameters, paramsHaveChanged, searchFieldsFromParams } from './params';
import { mockCorpus, mockCorpus3, mockField2, mockField } from '../../mock-data/corpus';
import { MultipleChoiceFilter, QueryModel } from '../models';

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
        const p = { a: null, b: '1', c: 'test' };

        expect(omitNullParameters(p)).toEqual(
            { b: '1', c: 'test' }
        );
    });
});

describe('omitNullParameters', () => {
    it('should omit null parameters', () => {
        const p = { a: null, b: '1', c: 'test' };

        expect(omitNullParameters(p)).toEqual(
            { b: '1', c: 'test' }
        );
    });
});

describe('paramsHaveChanged', () => {
    const corpus = mockCorpus;
    let queryModel: QueryModel;

    beforeEach(() => {
        queryModel = new QueryModel(corpus);
    });

    it('should detect changes in parameters', () => {
        const params1 = convertToParamMap({});
        const params2 = convertToParamMap({query: 'test'});

        expect(paramsHaveChanged(queryModel, params1)).toBeFalse();
        expect(paramsHaveChanged(queryModel, params2)).toBeTrue();

        queryModel = new QueryModel(corpus, params2);

        expect(paramsHaveChanged(queryModel, params2)).toBeFalse();
        expect(paramsHaveChanged(queryModel, params1)).toBeTrue();

    });

    it('should detect new filters', () => {
        const filter = mockField.makeSearchFilter() as MultipleChoiceFilter;
        filter.set(['test']);
        const params = convertToParamMap(filter.toRouteParam());

        expect(paramsHaveChanged(queryModel, params)).toBeTrue();
    });
});
