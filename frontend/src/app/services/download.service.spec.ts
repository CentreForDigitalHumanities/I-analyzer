import { TestBed, inject } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from './api.service.mock';
import { DownloadService } from './download.service';
import { ElasticSearchService } from './elastic-search.service';
import { ElasticSearchServiceMock } from './elastic-search.service.mock';

describe('DownloadService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ApiService, useValue: new ApiServiceMock() },
                DownloadService,
                { provide: ElasticSearchService, useValue: new ElasticSearchServiceMock() },
            ]
        });
    });

    it('should be created', inject([DownloadService], (service: DownloadService) => {
        expect(service).toBeTruthy();
    }));
});
