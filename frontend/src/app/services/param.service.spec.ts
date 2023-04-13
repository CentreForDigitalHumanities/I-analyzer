import { inject, TestBed } from '@angular/core/testing';

import { ParamService } from './param.service';
import { SearchService } from './search.service';
import { SearchServiceMock } from '../../mock-data/search';
import { convertToParamMap } from '@angular/router';

describe('ParamService', () => {
  let service: ParamService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [
            ParamService,
            { provide: SearchService, useValue: new SearchServiceMock() }
        ]
    });
    service = TestBed.inject(ParamService);
  });

  it('should be created', inject([ParamService], (service: ParamService) => {
    expect(service).toBeTruthy();
  }));

});
