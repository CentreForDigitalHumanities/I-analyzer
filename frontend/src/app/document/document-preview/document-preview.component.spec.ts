import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DocumentPreviewComponent } from './document-preview.component';
import { commonTestBed } from '../../common-test-bed';
import { mockCorpus } from '../../../mock-data/corpus';
import { makeDocument } from '../../../mock-data/constructor-helpers';

describe('DocumentPreviewComponent', () => {
    let component: DocumentPreviewComponent;
    let fixture: ComponentFixture<DocumentPreviewComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentPreviewComponent);
        component = fixture.componentInstance;
        component.corpus = mockCorpus;
        component.document = makeDocument({ great_field: 'Hello world!' });
        fixture.detectChanges();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentPreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
