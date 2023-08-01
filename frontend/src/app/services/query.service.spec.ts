import { TestBed, inject } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from '../../mock-data/api';
import { ApiRetryService } from './api-retry.service';
import { QueryService } from './query.service';
import { SessionService } from './session.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('QueryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                QueryService,
                ApiRetryService,
                { provide: ApiService, useValue: new ApiServiceMock() },
                SessionService,
            ],
            imports: [RouterTestingModule],
        });
    });

    it('should be created', inject([QueryService], (service: QueryService) => {
        expect(service).toBeTruthy();
    }));
});
