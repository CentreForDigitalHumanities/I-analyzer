import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockCorpus, mockCorpus2 } from '../../mock-data/corpus';
import { commonTestBed } from '../common-test-bed';
import { QueryModel } from '../models';

import { HighlightSelectorComponent } from './highlight-selector.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('HighlightSelectorComponent', () => {
    let component: HighlightSelectorComponent;
    let fixture: ComponentFixture<HighlightSelectorComponent>;

    beforeEach(async () => {
        commonTestBed().testingModule.compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HighlightSelectorComponent);
        component = fixture.componentInstance;
        // component.queryModel = new QueryModel(mockCorpus2);
        fixture.detectChanges();
    });

    beforeEach(() => {
        // component.queryModel = new QueryModel(mockCorpus);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('should reflect the query model state', () => {
    //     const button = fixture.debugElement.query(By.css('.highlight-toggle'));

    //     const disabled = (el: DebugElement) => el.nativeElement.disabled;
    //     const innerText = (el: DebugElement) => el.nativeElement.innerText;

    //     expect(disabled(button)).toBeTrue();
    //     expect(innerText(button)).toBe('OFF');

    //     component.queryModel.queryText = 'test';
    //     fixture.detectChanges();

    //     expect(disabled(button)).toBeFalse();
    //     expect(innerText(button)).toBe('OFF');

    //     component.queryModel.setHighlight(200);
    //     fixture.detectChanges();

    //     expect(disabled(button)).toBeFalse();
    //     expect(innerText(button)).toBe('ON');

    //     component.queryModel.queryText = undefined;
    //     fixture.detectChanges();

    //     expect(disabled(button)).toBeTrue();
    //     expect(innerText(button)).toBe('ON');
    // });
});
