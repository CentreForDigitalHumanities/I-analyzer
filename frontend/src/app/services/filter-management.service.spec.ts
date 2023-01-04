import { inject, TestBed } from '@angular/core/testing';

import { FilterManagementService } from './filter-management.service';
import { SearchService } from './search.service';
import { SearchServiceMock } from '../../mock-data/search';

describe('FilterManagementService', () => {
  let service: FilterManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [
            FilterManagementService,
            { provide: SearchService, useValue: new SearchServiceMock() }
        ]
    });
    // service = TestBed.inject(FilterManagementService);
  });

  it('should be created', inject([FilterManagementService], (service: FilterManagementService) => {
    expect(service).toBeTruthy();
  }));
});
