import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentTagsComponent } from './document-tags.component';
import { commonTestBed } from '../../common-test-bed';

describe('DocumentTagsComponent', () => {
    let component: DocumentTagsComponent;
    let fixture: ComponentFixture<DocumentTagsComponent>;

    beforeEach(async () => {
        commonTestBed().testingModule.compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentTagsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
