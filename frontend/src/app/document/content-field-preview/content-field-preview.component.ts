import { Component, Input } from '@angular/core';
import { CorpusField, FoundDocument } from '@models';

@Component({
    selector: 'ia-content-field-preview',
    templateUrl: './content-field-preview.component.html',
    styleUrl: './content-field-preview.component.scss',
    standalone: false
})
export class ContentFieldPreviewComponent {
    @Input() field: CorpusField;
    @Input() document: FoundDocument;
}
