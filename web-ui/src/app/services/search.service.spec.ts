import { TestBed, inject } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from './api.service.mock';
import { SearchService } from './search.service';

describe('SearchService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SearchService, { provide: ApiService, useValue: new ApiServiceMock() }]
        });
    });

    it('should be created', inject([SearchService], (service: SearchService) => {
        expect(service).toBeTruthy();
    }));
});
