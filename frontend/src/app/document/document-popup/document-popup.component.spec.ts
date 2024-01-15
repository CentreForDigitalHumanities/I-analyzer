import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DocumentPopupComponent } from './document-popup.component';
import { commonTestBed } from '../../common-test-bed';

describe('DocumentPopupComponent', () => {
    let component: DocumentPopupComponent;
    let fixture: ComponentFixture<DocumentPopupComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
