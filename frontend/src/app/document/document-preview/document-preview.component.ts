import { Component, Input } from '@angular/core';
import { FoundDocument } from '../../models';
import { DocumentPage } from '../../models/document-page';
import { actionIcons, documentIcons } from '../../shared/icons';

@Component({
    selector: 'ia-document-preview',
    templateUrl: './document-preview.component.html',
    styleUrls: ['./document-preview.component.scss']
})
export class DocumentPreviewComponent {
    @Input() document: FoundDocument;
    @Input() page: DocumentPage;

    actionIcons = actionIcons;
    documentIcons = documentIcons;

    get documentUrl(): string[] {
        if (this.document) {
            return ['/document', this.document.corpus.name, this.document.id];
        }
    }

    goToScan(page: DocumentPage, document: FoundDocument, event: Event) {
        page.focus(document, 'scan');
        event.stopPropagation();
    };

}
