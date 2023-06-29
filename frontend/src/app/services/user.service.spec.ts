import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ApiServiceMock } from '../../mock-data/api';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { UserService } from './user.service';

describe('UserService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ApiService, useValue: new ApiServiceMock() },
                UserService,
                SessionService,
                { provide: Router, useClass: RouterMock },
            ],
            imports: [HttpClientTestingModule],
        });
    });

    it('should be created', inject([UserService], (service: UserService) => {
        expect(service).toBeTruthy();
    }));
});

class RouterMock {}
