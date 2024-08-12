import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { forwardLegacyParamsGuard } from './forward-legacy-params.guard';

describe('forwardLegacyParamsGuard', () => {
    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => forwardLegacyParamsGuard(...guardParameters));

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(executeGuard).toBeTruthy();
    });
});
