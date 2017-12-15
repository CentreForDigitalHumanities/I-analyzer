import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';

import { DocumentViewComponent } from './document-view.component';
import { HighlightPipe, SearchRelevanceComponent } from '../search/index';
import { HighlightService } from '../services/index';

describe('DocumentViewComponent', () => {
    let component: DocumentViewComponent;
    let fixture: ComponentFixture<DocumentViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, DocumentViewComponent, SearchRelevanceComponent],
            providers: [HighlightService],
            imports: [BrowserModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // TODO: Uncaught NetworkError: Failed to execute 'send' on 'XMLHttpRequest': Failed to load 'ng:///DynamicTestModule/DocumentViewComponent.ngfactory.js'.
    xit('should be created', () => {
        expect(component).toBeTruthy();
    });
});
