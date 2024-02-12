import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { mockCorpus3, mockField } from '../../../mock-data/corpus';

import { commonTestBed } from '../../common-test-bed';
import { BooleanFilter, QueryModel } from '../../models';
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

    it('should handle checkbox events', () => {
        // trigger onchange of the checkbox
        const checkbox = fixture.debugElement.query(By.css('p-checkbox'));
        const triggerCheckbox = (value: boolean) => {
            // type of event obj derived from https://github.com/primefaces/primeng/blob/14.2.2/src/app/components/checkbox/checkbox.ts
            const eventObj = { checked: value, originalEvent: null };
            checkbox.triggerEventHandler('onChange', eventObj);
        };

        spyOn(component, 'update');
        triggerCheckbox(true);
        expect(component.update).toHaveBeenCalledOnceWith(true);

        triggerCheckbox(false);
        expect(component.update).toHaveBeenCalledTimes(2);
        expect(component.update).toHaveBeenCalledWith(false);
    });
});
