import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule, Router } from '@angular/router';

import { Observable } from 'rxjs';
import { ButtonModule, MenuModule } from 'primeng/primeng';

import { ConfigService, UserService } from '../services/index';
import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MenuComponent],
            imports: [RouterModule, ButtonModule, MenuModule],
            providers: [
                { provide: Router, useValue: { events: Observable.of({}) } },
                { provide: ConfigService, useValue: {} },
                {
                    provide: UserService, useValue: {
                        checkSession: () => {
                            return Promise.resolve(true)
                        }
                    }
                }
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
