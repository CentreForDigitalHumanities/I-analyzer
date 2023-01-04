import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';
import { mockCorpus } from '../../mock-data/corpus';

import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
    let component: SearchComponent;
    let fixture: ComponentFixture<SearchComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
