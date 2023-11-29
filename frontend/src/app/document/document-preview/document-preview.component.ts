import { Component, Input } from '@angular/core';
import { FoundDocument } from '../../models';
import { DocumentPage } from '../../models/document-page';

@Component({
    selector: 'ia-document-preview',
    templateUrl: './document-preview.component.html',
    styleUrls: ['./document-preview.component.scss']
})
export class DocumentPreviewComponent {
    @Input() document: FoundDocument;
    @Input() page: DocumentPage;

    goToScan(page: DocumentPage, document: FoundDocument, event: Event) {
        page.focus(document, 'scan');
        event.stopPropagation();
    };

}
