import { TestBed, inject } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { Http } from '@angular/http'

import { ApiService, ConfigService, PdfService } from './index'
import { ApiServiceMock } from './api.service.mock'

describe('PdfService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PdfService,
        { provide: ApiService, useValue: new ApiServiceMock() },
        ConfigService
      ],
      imports: [HttpClientModule]
    });
  });

  it('should be created', inject([PdfService], (service: PdfService) => {
    expect(service).toBeTruthy();
  }));
});
