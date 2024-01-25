import { Component, Input } from '@angular/core';
import { FoundDocument } from '../../models';
import { DocumentPage } from '../../models/document-page';
import { documentIcons } from '../../shared/icons';

@Component({
    selector: 'ia-document-preview',
    templateUrl: './document-preview.component.html',
    styleUrls: ['./document-preview.component.scss']
})
export class DocumentPreviewComponent {
    @Input() document: FoundDocument;
    @Input() page: DocumentPage;

    documentIcons = documentIcons;

    goToScan(page: DocumentPage, document: FoundDocument, event: Event) {
        page.focus(document, 'scan');
        event.stopPropagation();
    };

}
