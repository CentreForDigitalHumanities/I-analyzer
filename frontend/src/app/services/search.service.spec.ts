import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from '../../mock-data/api';
import { ApiRetryService } from './api-retry.service';
import { ElasticSearchService } from './elastic-search.service';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { SearchService } from './search.service';
import { SessionService } from './session.service';
import { UserService } from './user.service';

describe('SearchService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes([])],
            providers: [
                SearchService,
                ApiRetryService,
                { provide: ApiService, useValue: new ApiServiceMock() },
                { provide: ElasticSearchService, useValue: new ElasticSearchServiceMock() },
                LogService,
                QueryService,
                UserService,
                SessionService
            ]
        });
    });

    it('should be created', inject([SearchService], (service: SearchService) => {
        expect(service).toBeTruthy();
    }));
});
