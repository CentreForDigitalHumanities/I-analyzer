import { TestBed } from '@angular/core/testing';

import { ParamService } from './param.service';

describe('ParamService', () => {
  let service: ParamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
