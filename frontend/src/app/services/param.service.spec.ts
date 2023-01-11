import { inject, TestBed } from '@angular/core/testing';

import { ParamService } from './param.service';
import { SearchService } from './search.service';
import { SearchServiceMock } from '../../mock-data/search';

describe('ParamService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [
            ParamService,
            { provide: SearchService, useValue: new SearchServiceMock() }
        ]
    });
  });

  it('should be created', inject([ParamService], (service: ParamService) => {
    expect(service).toBeTruthy();
  }));
});
