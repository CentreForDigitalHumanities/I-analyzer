import { inject, TestBed } from '@angular/core/testing';

import { ChartOptionsService } from './chart-options.service';

describe('ChartOptionsService', () => {
  let service: ChartOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [ChartOptionsService]
    });
    service = TestBed.inject(ChartOptionsService);
  });

  it('should be created', inject([ChartOptionsService], (chartOptionsService: ChartOptionsService) => {
    expect(chartOptionsService).toBeTruthy();
  }));
});
