import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule, Router } from '@angular/router';

import { of } from 'rxjs';
import { ButtonModule, MenuModule } from 'primeng/primeng';

import { ApiService, ApiRetryService, ConfigService, CorpusService, LogService, UserService, } from '../services/index';
import { UserServiceMock } from '../services/user.service.mock';
import { ApiServiceMock } from '../services/api.service.mock';
import { MenuComponent } from './menu.component';
import { MockCorpusResponse } from '../../mock-data/corpus';

describe('MenuComponent', () => {
    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MenuComponent],
            imports: [RouterModule, ButtonModule, MenuModule],

            providers: [
                ApiRetryService,
                { provide: Router, useValue: { events: of({}) } },
                { provide: ConfigService, useValue: {} },
                {
                    provide: UserService, useValue: new UserServiceMock()
                },
                CorpusService,
                ApiRetryService,
                LogService,
                {
                    provide: ApiService, useValue: new ApiServiceMock({
                        ['corpus']: MockCorpusResponse
                    })
                },
                LogService
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        // TODO: DOESN'T WORK BECAUSE label isn't a known property of 'button'
        expect(component).toBeTruthy();
    });
});
