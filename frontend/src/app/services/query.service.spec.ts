import { TestBed, inject } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from '../../mock-data/api';
import { ApiRetryService } from './api-retry.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { UserServiceMock } from '../../mock-data/user';

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
