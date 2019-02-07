import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DocumentViewComponent } from './document-view.component';
import { HighlightPipe, SearchRelevanceComponent } from '../search/index';
import { HighlightService } from '../services/index';

import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { TabViewModule } from 'primeng/tabview';
import { HttpClientModule } from '@angular/common/http';
import { ScanPdfComponent } from './scan-pdf.component';
import { ConfirmDialogModule } from 'primeng/primeng';

describe('DocumentViewComponent', () => {
    let component: DocumentViewComponent;
    let fixture: ComponentFixture<DocumentViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, DocumentViewComponent, ScanPdfComponent, SearchRelevanceComponent, PdfViewerComponent],
            imports: [TabViewModule, HttpClientModule, ConfirmDialogModule],
            providers: [HighlightService]
        }).compileComponents();
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
            searchable: false,
            searchFilter: null,
            downloadable: true
        }];
        component.document = {
            relevance: 0.5,
            fieldValues: { 'test': 'Hello world!' },
            id: 'test',
            position: 1
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
