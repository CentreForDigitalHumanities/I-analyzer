import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { commonTestBed } from '../common-test-bed';

import { SearchComponent } from './search.component';

import { mockUser } from './../../mock-data/user';
import { mockCorpus } from './../../mock-data/corpus';

describe('SearchComponent', () => {
    let component: SearchComponent;
    let fixture: ComponentFixture<SearchComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(async () => {
        fixture = TestBed.createComponent(SearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should show download controls for authenticated user', async () => {
        await fixture.whenStable();
        expect(fixture.debugElement.query(By.css('ia-search'))).toBeTruthy();
    });
});
