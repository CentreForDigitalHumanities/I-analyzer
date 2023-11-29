import { Component, Input } from '@angular/core';
import { FoundDocument } from '../../models';
import { PageResults } from '../../models/page-results';

@Component({
    selector: 'ia-document-preview',
    templateUrl: './document-preview.component.html',
    styleUrls: ['./document-preview.component.scss']
})
export class DocumentPreviewComponent {
    @Input() document: FoundDocument;
    @Input() page: PageResults;
}
