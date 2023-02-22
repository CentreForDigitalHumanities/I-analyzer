import { inject, TestBed } from '@angular/core/testing';

import { ChartOptionsService } from './chart-options.service';
import { ParamService } from './param.service';
import { SearchService } from './search.service';
import { SearchServiceMock } from '../../mock-data/search';

describe('ChartOptionsService', () => {
  let service: ChartOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [ChartOptionsService, ParamService,
            { provide: SearchService, useValue: new SearchServiceMock() }]
    });
    service = TestBed.inject(ChartOptionsService);
  });

  it('should be created', inject([ChartOptionsService], (chartOptionsService: ChartOptionsService) => {
    expect(chartOptionsService).toBeTruthy();
  }));
});
