import { mockField2, mockFieldDate, mockFieldMultipleChoice } from '../../mock-data/corpus';
import { Corpus, } from './corpus';
import { QueryModel } from './query';
import { SearchFilter } from './field-filter';
import { convertToParamMap } from '@angular/router';
import * as _ from 'lodash';

const corpus: Corpus = {
    name: 'mock-corpus',
    title: 'Mock Corpus',
    serverName: 'default',
    description: '',
    index: 'mock-corpus',
    minDate: new Date('1800-01-01'),
    maxDate: new Date('1900-01-01'),
    image: '',
    scan_image_type: null,
    allow_image_download: true,
    word_models_present: false,
    fields: [
        mockField2,
        mockFieldDate,
        mockFieldMultipleChoice,
    ],
    languages: ['English'],
    category: 'Tests',
} as Corpus;

describe('QueryModel', () => {
    let query: QueryModel;
    let filter: SearchFilter;
    let filter2: SearchFilter;

    const someDate = new Date('Jan 1 1850');
    const someSelection = ['hooray!'];

    beforeEach(() => {
        query = new QueryModel(corpus, undefined);

        filter = query.filterForField(mockFieldDate);
        filter2 = query.filterForField(mockFieldMultipleChoice);
    });

    it('should create', () => {
        expect(query).toBeTruthy();
    });

    it('should signal updates', () => {
        let updates = 0;
        query.update.subscribe(() => updates += 1);

        query.setQueryText('test');
        expect(updates).toBe(1);

        filter.setToValue(someDate);
        expect(updates).toBe(2);

        filter.deactivate();
        expect(updates).toBe(3);
    });

    it('should remove filters', () => {
        let updates = 0;
        query.update.subscribe(() => updates += 1);

        filter.setToValue(someDate);
        filter2.setToValue(someSelection);

        expect(query.activeFilters.length).toBe(2);
        expect(updates).toBe(2);

        filter.setToValue(new Date('Jan 1 1860'));

        expect(query.activeFilters.length).toBe(2);
        expect(updates).toBe(3);

        filter.deactivate();

        expect(query.activeFilters.length).toBe(1);
        expect(updates).toBe(4);

        filter.setToValue(new Date('Jan 1 1870'));

        expect(query.activeFilters.length).toBe(2);
        expect(updates).toBe(5);
    });

    it('should convert to an elasticsearch query', () => {
        expect(query.toEsQuery()).toEqual({
            query: {
                match_all: {}
            }
        });

        query.setQueryText('test');

        expect(query.toEsQuery()).toEqual({
            query: {
                bool: {
                    must: {
                        simple_query_string: {
                            query: 'test',
                            lenient: true,
                            default_operator: 'or',
                        }
                    },
                    filter: []
                }
            }
        });
    });

    it('should formulate parameters', () => {
        expect(query.toRouteParam()).toEqual({
            query: null,
            fields: null,
            speech: null,
            date: null,
            greater_field: null,
            sort: null,
            highlight: null,
            tags: null,
        });

        query.setQueryText('test');

        expect(query.toRouteParam()).toEqual({
            query: 'test',
            fields: null,
            speech: null,
            date: null,
            greater_field: null,
            sort: null,
            highlight: null,
            tags: null,
        });

        filter.setToValue(someDate);

        expect(query.toRouteParam()).toEqual({
            query: 'test',
            fields: null,
            speech: null,
            date: '1850-01-01:1850-01-01',
            greater_field: null,
            sort: null,
            highlight: null,
            tags: null,
        });

        query.setQueryText('');
        filter.deactivate();

        expect(query.toRouteParam()).toEqual({
            query: null,
            fields: null,
            speech: null,
            date: null,
            greater_field: null,
            sort: null,
            highlight: null,
            tags: null,
        });
    });

    it('should set from parameters', () => {
        const params = convertToParamMap({
            query: 'test',
            date: '1850-01-01:1850-01-01',
        });

        const newQuery = new QueryModel(corpus, params);
        expect(newQuery.queryText).toEqual('test');
        expect(newQuery.activeFilters.length).toBe(1);
    });

    it('should reflect the highlight state in parameters', () => {
        const highlightParam = () => _.get(query.toRouteParam(), 'highlight');

        expect(highlightParam()).toBe(null);

        query.setHighlight(200);
        expect(highlightParam()).toBe(null);

        query.setQueryText('test');
        expect(highlightParam()).toBe('200');

        query.setHighlight(400);
        expect(highlightParam()).toBe('400');

        query.setHighlight();
        expect(highlightParam()).toBe(null);
    });

    it('should formulate a link', () => {
        query.setQueryText('test');
        filter.setToValue(someDate);

        expect(query.toQueryParams()).toEqual({ query: 'test', date: '1850-01-01:1850-01-01' });
    });

    it('should clone', () => {
        query.setQueryText('test');
        filter.setToValue(someDate);

        const clone = query.clone();

        query.setQueryText('different test');
        expect(clone.queryText).toEqual('test');

        filter.setToValue(new Date('Jan 2 1850'));
        expect(query.filterForField(mockFieldDate).currentData.min).toEqual(new Date('Jan 2 1850'));
        expect(clone.filterForField(mockFieldDate).currentData.min).toEqual(new Date('Jan 1 1850'));
    });

    it('should create without a tag service', () => {
        const taglessQuery = new QueryModel(corpus);
        expect(taglessQuery).toBeTruthy();
    });
});
