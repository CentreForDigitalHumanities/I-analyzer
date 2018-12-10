import { TestBed, inject } from '@angular/core/testing';

import { ScanImageService } from './scan-image.service';
import { HttpClientModule } from '@angular/common/http';

describe('ScanImageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScanImageService],
      imports: [HttpClientModule]
    });
  });

  it('should be created', inject([ScanImageService], (service: ScanImageService) => {
    expect(service).toBeTruthy();
  }));
});
