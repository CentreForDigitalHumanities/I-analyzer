import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ElasticSearchService, SearchResponse } from './elastic-search.service';
import { QueryModel } from '../models';
import { mockCorpus } from '../../mock-data/corpus';

const mockResponse: SearchResponse = {
    took: 4,
    timed_out: false,
    hits: {
        total: {
            value: 20,
            relation: 'eq',
        },
        max_score: 1.0,
        hits: [
            {
                _score: 1.0,
                _id: 'doc1',
                _source: {
                    great_field: 'test',
                    speech: 'This is a test',
                }
            }, {
                _score: 0.8,
                _id: 'doc2',
                _source: {
                    great_field: 'test',
                    speech: 'This is a another test',
                }
            },
        ],
    },
};

describe('ElasticSearchService', () => {
    let service: ElasticSearchService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ElasticSearchService,
            ],
            imports: [ HttpClientTestingModule ]
        });
        service = TestBed.inject(ElasticSearchService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    it('should be created',() => {
        expect(service).toBeTruthy();
    });

    it('should make a search request', async () => {
        const queryModel = new QueryModel(mockCorpus);
        const size = 2;
        const response = service.search(queryModel, size);

        const searchUrl = `/api/es/${mockCorpus.name}/_search?size=${size}`;
        httpTestingController.expectOne(searchUrl).flush(mockResponse);
        httpTestingController.verify();

        const result = await response;
        expect(result.documents.length).toBe(2);
        expect(result.total.value).toBe(20);
    });
});
