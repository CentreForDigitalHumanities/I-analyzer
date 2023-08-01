import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import * as _ from 'lodash';
import { mockCorpus, mockField } from '../../mock-data/corpus';

import { commonTestBed } from '../common-test-bed';

import { DocumentViewComponent } from './document-view.component';

describe('DocumentViewComponent', () => {
    let component: DocumentViewComponent;
    let fixture: ComponentFixture<DocumentViewComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentViewComponent);
        component = fixture.componentInstance;
        component.corpus = _.merge({
            scan_image_type: 'farout_image_type',
            fields: [mockField]
        }, mockCorpus);
        component.document = {
            id: 'test',
            relevance: 0.5,
            fieldValues: { great_field: 'Hello world!' }
        };
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should render fields', async () => {
        await fixture.whenStable();

        expect(component.propertyFields).toEqual([mockField]);

        const debug = fixture.debugElement.queryAll(By.css('[data-test-field-value]'));
        expect(debug.length).toEqual(1); // number of fields
        const element = debug[0].nativeElement;
        expect(element.textContent).toBe('Hello world!');
    });

    it('should list tabs', () => {
        component.ngOnChanges();

        expect(component.tabs.length).toBe(2);
        expect(component.tabs[0].value).toBe('speech');
        expect(component.tabs[1].value).toBe('scan');
    });
});
