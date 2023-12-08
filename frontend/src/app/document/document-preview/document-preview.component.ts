import { Component, Input } from '@angular/core';
import { FoundDocument } from '../../models';
import { DocumentPage } from '../../models/document-page';
import { faNewspaper } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'ia-document-preview',
    templateUrl: './document-preview.component.html',
    styleUrls: ['./document-preview.component.scss']
})
export class DocumentPreviewComponent {
    @Input() document: FoundDocument;
    @Input() page: DocumentPage;

    scanIcon = faNewspaper;

    goToScan(page: DocumentPage, document: FoundDocument, event: Event) {
        page.focus(document, 'scan');
        event.stopPropagation();
    };

}
