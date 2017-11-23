import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from './api.service.mock';
import { ElasticSearchService } from './elastic-search.service';
import { ElasticSearchServiceMock } from './elastic-search.service.mock';
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
