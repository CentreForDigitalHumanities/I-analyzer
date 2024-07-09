import {
    highlightFromParams, omitNullParameters, pageFromParams, pageToParams, searchFieldsFromParams,
    sortSettingsFromParams, sortSettingsToParams
} from './params';
import { mockCorpus, mockCorpus3, mockField2, mockField } from '../../mock-data/corpus';
import { SortState } from '../models';
import * as _ from 'lodash';
import { PageParameters, PageResultsParameters } from '../models/page-results';

describe('searchFieldsFromParams', () => {
    it('should parse field parameters', () => {
        const params = {fields: 'speech,great_field'};
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

        expect(sortSettingsFromParams(empty, corpus)).toEqual([undefined, 'desc']);

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

describe('pageFromParams', () => {
    it('should be the inverse of pageToParams', () => {
        const state: PageParameters = {
            from: 0,
            size: 20,
        };

        expect(pageFromParams(pageToParams(state))).toEqual(state);

        state.from = 40;
        expect(pageFromParams(pageToParams(state))).toEqual(state);
    });

    it('should use blank parameters for the default state', () => {
        const state: PageParameters = {
            from: 0,
            size: 20,
        };

        expect(pageToParams(state)).toEqual({ p: null });
        expect(pageFromParams({})).toEqual(state);
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
