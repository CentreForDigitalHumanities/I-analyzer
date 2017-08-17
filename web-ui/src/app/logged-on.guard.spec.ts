import { TestBed, async, inject } from '@angular/core/testing';

import { LoggedOnGuard } from './logged-on.guard';

describe('LoggedOnGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggedOnGuard]
    });
  });

  it('should ...', inject([LoggedOnGuard], (guard: LoggedOnGuard) => {
    expect(guard).toBeTruthy();
  }));
});
