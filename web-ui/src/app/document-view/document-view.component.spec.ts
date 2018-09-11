import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DocumentViewComponent } from './document-view.component';
import { HighlightPipe, SearchRelevanceComponent } from '../search/index';
import { HighlightService } from '../services/index';

describe('DocumentViewComponent', () => {
    let component: DocumentViewComponent;
    let fixture: ComponentFixture<DocumentViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, DocumentViewComponent, SearchRelevanceComponent],
            providers: [HighlightService]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should render fields', async () => {
        component.fields = [{
            name: 'test',
            displayName: 'Test',
            displayType: 'text',
            description: 'Description',
            hidden: false,
            sortable: false,
            searchable: false,
            searchFilter: null
        }];
        component.document = {
            relevance: 0.5,
            fieldValues: { 'test': 'Hello world!' },
            id: 'test',
            position: 1
        };
        fixture.detectChanges();
        await fixture.whenStable();

        let debug = fixture.debugElement.queryAll(By.css('[data-test-field-value]'));
        expect(debug.length).toEqual(1); // number of fields
        let element = debug[0].nativeElement;
        expect(element.textContent).toBe('Hello world!');
    });
});
