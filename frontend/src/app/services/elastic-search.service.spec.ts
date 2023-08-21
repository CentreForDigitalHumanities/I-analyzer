import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ElasticSearchService, SearchResponse } from './elastic-search.service';
import { Aggregator, QueryModel } from '../models';
import { mockCorpus, mockField, mockField2 } from '../../mock-data/corpus';
import { TagService } from './tag.service';
import { TagServiceMock } from 'src/mock-data/tag';

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

const mockAggregationResponse: SearchResponse = {
    took: 4,
    timed_out: false,
    hits: {
        total: {
            value: 20,
            relation: 'eq',
        },
        max_score: 1.0,
        hits: [],
    },
    aggregations: {
        great_field: {
            buckets: [
                { key: 'test', doc_count: 15 },
                { key: 'testtest', doc_count: 5 },
            ]
        }
    }
};

describe('ElasticSearchService', () => {
    let service: ElasticSearchService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ElasticSearchService,
                { provide: TagService, useValue: new TagServiceMock() }
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

    it('should request a document by ID', async () => {
        const response = service.getDocumentById('doc1', mockCorpus);

        const searchUrl = `/api/es/${mockCorpus.name}/_search?size=1`;
        httpTestingController.expectOne(searchUrl).flush(mockResponse);
        httpTestingController.verify();

        const result = await response;
        expect(result.fieldValue(mockField2)).toBe('This is a test');
    });

    it('should make an aggregation request', async () => {
        const queryModel = new QueryModel(mockCorpus);
        const aggregator: Aggregator = {
            name: mockField.name,
            size: 10,
        };
        const response = service.aggregateSearch(
            mockCorpus,
            queryModel,
            [aggregator]
        );

        const searchUrl = `/api/es/${mockCorpus.name}/_search?size=0`;
        httpTestingController.expectOne(searchUrl).flush(mockAggregationResponse);
        httpTestingController.verify();

        const result = await response;
        expect(result).toBeTruthy();
    });
});
