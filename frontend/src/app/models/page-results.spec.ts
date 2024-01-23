import { TestBed, inject } from '@angular/core/testing';
import { SearchService } from '../services/search.service';
import { PageResults, PageResultsParameters } from './page-results';
import { QueryModel } from './query';
import { mockCorpus, mockField } from '../../mock-data/corpus';
import { SearchResults } from './search-results';
import { FoundDocument } from './found-document';
import { SimpleStore } from '../store/simple-store';
import { convertToParamMap } from '@angular/router';

class SearchServiceMock {
    searched = 0;

    loadResults(queryModel: QueryModel, resultsParams: PageResultsParameters): Promise<SearchResults> {
        this.searched += 1;

        const doc = new FoundDocument(
            undefined,
            mockCorpus,
            {
                _id: 'test_1',
                _score: 1.0,
                _source: {
                    great_field: 'test',
                    speech: 'This is a document!'
                },
            },
            1.0
        );
        return Promise.resolve({
            documents: [doc],
            total: { value: 1, relation: 'eq' }
        });
    }
}

describe('PageResults', () => {
    let store: SimpleStore;
    let queryModel: QueryModel;
    let results: PageResults;
    let service: SearchServiceMock;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: SearchService, useValue: new SearchServiceMock() },
            ],
        });
    });

    beforeEach(inject([SearchService], (searchService: SearchService) => {
        store = new SimpleStore();
        queryModel = new QueryModel(mockCorpus);
        service = searchService as unknown as SearchServiceMock;
        results = new PageResults(store, searchService, queryModel);
    }));

    it('should be created', () => {
        expect(results).toBeTruthy();
    });

    it('should load from parameters', () => {
        store.paramUpdates$.next({
            query: 'test',
            highlight: '200',
        });
        queryModel = new QueryModel(mockCorpus, convertToParamMap(store.currentParams()));
        results = new PageResults(store, service as unknown as SearchService, queryModel);

        expect(results.state$.value.highlight).toBe(200);
    });

    it('should set the sort state', () => {
        results.setSortBy(mockField);
        expect(results.state$.value.sort).toEqual([mockField, 'desc']);

        results.setSortDirection('asc');
        expect(results.state$.value.sort).toEqual([mockField, 'asc']);

        results.setSortBy(undefined);
        expect(results.state$.value.sort).toEqual([undefined, 'desc']);
    });

    it('should reset the page when changing sorting', () => {
        results.setParams({from: 20});
        expect(results.state$.value.from).toBe(20);

        results.setSortBy(mockField);
        expect(results.state$.value.from).toBe(0);

        results.setParams({from: 20});
        results.setSortDirection('asc');
        expect(results.state$.value.from).toBe(0);
    });

    it('should reset highlighting when there is no query text', () => {
        queryModel.setQueryText('test');
        results.setParams({ highlight: 200 });
        expect(results.state$.value.highlight).toBe(200);

        queryModel.setQueryText('different test');
        expect(results.state$.value.highlight).toBe(200);

        queryModel.setQueryText('');
        expect(results.state$.value.highlight).toBeUndefined();
    });

    it('should not fetch results without an observer', () => {
        expect(service.searched).toBe(0);
    });

    it('should fetch results when an observer is added', () => {
        service.searched = 0;
        results.result$.subscribe();
        expect(service.searched).toBe(1);
        service.searched = 0;
    });

});
