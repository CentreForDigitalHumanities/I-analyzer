import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentFieldComponent } from './content-field.component';
import { commonTestBed } from 'app/common-test-bed';
import { makeDocument } from 'mock-data/constructor-helpers';
import { mockField2 } from 'mock-data/corpus';

describe('ContentFieldComponent', () => {
    let component: ContentFieldComponent;
    let fixture: ComponentFixture<ContentFieldComponent>;

    beforeEach(async () => {
        await commonTestBed().testingModule.compileComponents();

        fixture = TestBed.createComponent(ContentFieldComponent);
        component = fixture.componentInstance;
        component.document = makeDocument({ speech: 'This is a test' });
        component.field = mockField2;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
