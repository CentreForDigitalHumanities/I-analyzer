import { convertToParamMap } from '@angular/router';
import {
    highlightFromParams, omitNullParameters, paramsHaveChanged, searchFieldsFromParams,
    sortSettingsFromParams, sortSettingsToParams
} from './params';
import { mockCorpus, mockCorpus3, mockField2, mockField } from '../../mock-data/corpus';
import { MultipleChoiceFilter, QueryModel, SortState } from '../models';
import * as _ from 'lodash';

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
        const params = {highlight: '100'};
        const highlight = highlightFromParams(params);
        expect(highlight).toBe(100);
    });

    it('should parse empty parameters', () => {
        const highlight = highlightFromParams({});
        expect(highlight).toBe(undefined);
    });
});

describe('sortSettingsFromParams', () => {
    it('should parse the default state', () => {
        const corpus = _.cloneDeep(mockCorpus);
        const empty = {};

        const field = corpus.fields[0];
        (corpus as any).defaultSort = [field, 'desc'];
        expect(sortSettingsFromParams(empty, corpus)).toEqual([field, 'desc']);
    });

    it('should be the inverse of sortSettingsToParams', () => {
        const sort: SortState = [mockField, 'asc'];
        const params = sortSettingsToParams(...sort, mockCorpus);
        expect(sortSettingsFromParams(params, mockCorpus)).toEqual(sort);
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

    // it('should detect changes in highlighting', () => {
    //     queryModel.setQueryText('test');

    //     const noHighlight = convertToParamMap({ query: 'test' });
    //     const withHighlight = convertToParamMap({ query: 'test', highlight: '200' });

    //     expect(paramsHaveChanged(queryModel, noHighlight)).toBeFalse();
    //     expect(paramsHaveChanged(queryModel, withHighlight)).toBeTrue();

    //     queryModel.setHighlight(200);

    //     expect(paramsHaveChanged(queryModel, noHighlight)).toBeTrue();
    //     expect(paramsHaveChanged(queryModel, withHighlight)).toBeFalse();

    //     queryModel.setHighlight();

    //     expect(paramsHaveChanged(queryModel, noHighlight)).toBeFalse();
    //     expect(paramsHaveChanged(queryModel, withHighlight)).toBeTrue();
    // });
});
