import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiServiceMock } from '../../mock-data/api';
import { ApiService } from './api.service';

import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [RouterTestingModule],
    providers: [
        SessionService,
        { provide: ApiService, useValue: new ApiServiceMock() },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});
        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

});
