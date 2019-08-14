import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule, Router } from '@angular/router';

import { of } from 'rxjs';
import { ButtonModule, MenuModule } from 'primeng/primeng';

import { commonTestBed } from '../common-test-bed';

import { ApiService, ApiRetryService, ConfigService, CorpusService, LogService, UserService, } from '../services/index';
import { MenuComponent } from './menu.component';
import { MockCorpusResponse } from '../../mock-data/corpus';

describe('MenuComponent', () => {
    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;

    beforeEach(async(() => {
        commonTestBed().testingModule.compileComponents();
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
