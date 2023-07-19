import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from '../../mock-data/api';
import { ApiRetryService } from './api-retry.service';
import { ElasticSearchService } from './elastic-search.service';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';
import { QueryService } from './query.service';
import { SearchService } from './search.service';
import { SessionService } from './session.service';
import { UserService } from './user.service';
import { WordmodelsService } from './wordmodels.service';
import { WordmodelsServiceMock } from '../../mock-data/wordmodels';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { QueryModel } from '../models';
import { mockCorpus } from '../../mock-data/corpus';
import { AuthService } from './auth.service';
import { AuthServiceMock } from '../../mock-data/auth';

describe('SearchService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
            ],
            providers: [
                SearchService,
                ApiRetryService,
                { provide: AuthService, useValue: new AuthServiceMock() },
                { provide: ApiService, useValue: new ApiServiceMock() },
                {
                    provide: ElasticSearchService,
                    useValue: new ElasticSearchServiceMock(),
                },
                QueryService,
                SessionService,
            ],
        });
    });

    it('should be created', inject([SearchService], (service: SearchService) => {
        expect(service).toBeTruthy();
    }));

    it('should search', inject([SearchService], async (service: SearchService) => {
        const queryModel = new QueryModel(mockCorpus);
        const results = await service.search(queryModel);
        expect(results).toBeTruthy();
        expect(results.total.value).toBeGreaterThan(0);
    }));

});
