import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

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
        component.corpus = <any>{
            scan_image_type: 'farout_image_type'
        };
        component.fields = [{
            name: 'test',
            displayName: 'Test',
            displayType: 'text',
            description: 'Description',
            hidden: false,
            sortable: false,
            primarySort: false,
            searchable: false,
            searchFilter: null,
            downloadable: true,
            mappingType: 'text'
        }];
        component.document = {
            id: 'test',
            relevance: 0.5,
            fieldValues: { 'test': 'Hello world!' }
        };
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should render fields', async () => {
        await fixture.whenStable();

        let debug = fixture.debugElement.queryAll(By.css('[data-test-field-value]'));
        expect(debug.length).toEqual(1); // number of fields
        let element = debug[0].nativeElement;
        expect(element.textContent).toBe('Hello world!');
    });
});
