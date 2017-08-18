import { TestBed, inject } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ApiServiceMock } from './api.service.mock';
import { ApiService } from './api.service';
import { UserService } from './user.service';

describe('UserService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ApiService, useValue: new ApiServiceMock() },
                UserService,
                { provide: Router, useClass: RouterMock }]
        });
    });

    it('should be created', inject([UserService], (service: UserService) => {
        expect(service).toBeTruthy();
    }));
});

class RouterMock {

}
