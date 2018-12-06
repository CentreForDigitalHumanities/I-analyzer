import { TestBed, inject } from '@angular/core/testing';

import { ScanImageService } from './scan-image.service';

describe('ScanImageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScanImageService]
    });
  });

  it('should be created', inject([ScanImageService], (service: ScanImageService) => {
    expect(service).toBeTruthy();
  }));
});
