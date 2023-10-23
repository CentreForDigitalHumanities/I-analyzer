import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../../common-test-bed';

import { RangeFilterComponent } from './range-filter.component';
import { QueryModel, RangeFilter } from '../../models';
import { mockCorpus3, mockField3 } from '../../../mock-data/corpus';

describe('RangeFilterComponent', () => {
    let component: RangeFilterComponent;
    let fixture: ComponentFixture<RangeFilterComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(RangeFilterComponent);
        component = fixture.componentInstance;
        component.queryModel = new QueryModel(mockCorpus3);
        component.filter = component.queryModel.filterForField(mockField3) as RangeFilter;
        component.filter.set({ min: 1984, max: 1984 });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
