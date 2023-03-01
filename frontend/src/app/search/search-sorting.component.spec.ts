import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { mockField3 } from '../../mock-data/corpus';
import { commonTestBed } from '../common-test-bed';

import { SearchSortingComponent } from './search-sorting.component';


describe('Search Sorting Component', () => {
    let component: SearchSortingComponent;
    let fixture: ComponentFixture<SearchSortingComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchSortingComponent);
        component = fixture.componentInstance;
        component.fields = [mockField3];
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

