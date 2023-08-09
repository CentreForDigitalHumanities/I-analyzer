import { TestBed, inject } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ApiServiceMock } from '../../mock-data/api';
import { DownloadService } from './download.service';
import { ElasticSearchService } from './elastic-search.service';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';

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
