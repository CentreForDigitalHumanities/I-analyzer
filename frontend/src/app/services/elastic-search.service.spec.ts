import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElasticSearchService } from './elastic-search.service';
import { TagService } from './tag.service';
import { TagServiceMock } from '../../mock-data/tag';
describe('ElasticSearchService', () => {
    let service: ElasticSearchService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ElasticSearchService,
                { provide: TagService, useValue: new TagServiceMock() }
            ],
            imports: [ HttpClientTestingModule ]
        });
        service = TestBed.inject(ElasticSearchService);
    });

    it('should be created',() => {
        expect(service).toBeTruthy();
    });
});
