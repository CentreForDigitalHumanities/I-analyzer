import { TestBed, inject } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { Http } from '@angular/http'

import { ApiService, ConfigService, ScanImageService } from './index'
import { ApiServiceMock } from './api.service.mock'

describe('ScanImageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScanImageService,
        { provide: ApiService, useValue: new ApiServiceMock() },
        ConfigService
      ],
      imports: [HttpClientModule]
    });
  });

  it('should be created', inject([ScanImageService], (service: ScanImageService) => {
    expect(service).toBeTruthy();
  }));
});
