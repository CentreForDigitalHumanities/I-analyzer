import { TestBed, inject } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from './api.service.mock';
import { ApiRetryService } from './api-retry.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { UserServiceMock } from './user.service.mock';

describe('QueryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [QueryService,
                ApiRetryService,
                LogService,
                { provide: ApiService, useValue: new ApiServiceMock() },
                { provide: UserService, useValue: new UserServiceMock() }]
        });
    });

    it('should be created', inject([QueryService], (service: QueryService) => {
        expect(service).toBeTruthy();
    }));
});
