import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElasticSearchService } from './elastic-search.service';
import { Corpus, DateFilterData, QueryModel, SearchFilter } from '../models';
describe('ElasticSearchService', () => {
    let service: ElasticSearchService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ElasticSearchService,
            ],
            imports: [ HttpClientTestingModule ]
        });
        service = TestBed.inject(ElasticSearchService);
    });

    it('should be created',() => {
        expect(service).toBeTruthy();
    });
});
