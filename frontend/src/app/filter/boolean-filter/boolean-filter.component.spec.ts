import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { mockCorpus3, mockField } from '../../../mock-data/corpus';

import { commonTestBed } from '../../common-test-bed';
import { BooleanFilter, QueryModel } from '@models';
import { BooleanFilterComponent } from './boolean-filter.component';
import { By } from '@angular/platform-browser';

describe('BooleanFilterComponent', () => {
    let component: BooleanFilterComponent;
    let fixture: ComponentFixture<BooleanFilterComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BooleanFilterComponent);
        component = fixture.componentInstance;
        component.queryModel = new QueryModel(mockCorpus3);
        component.filter = component.queryModel.filterForField(mockField) as BooleanFilter;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should handle update events', () => {
        // trigger onchange of the dropdown
        const dropdown = fixture.debugElement.query(By.css('ia-dropdown'));
        const triggerDropdown = (value: boolean) => {
            dropdown.triggerEventHandler('onChange', value);
        };

        spyOn(component, 'update');
        triggerDropdown(true);
        expect(component.update).toHaveBeenCalledOnceWith(true);

        triggerDropdown(false);
        expect(component.update).toHaveBeenCalledTimes(2);
        expect(component.update).toHaveBeenCalledWith(false);
    });
});
