import { Component, Input } from '@angular/core';
import { CorpusField, FoundDocument } from '@models';

@Component({
    selector: 'ia-content-field',
    templateUrl: './content-field.component.html',
    styleUrl: './content-field.component.scss',
    standalone: false
})
export class ContentFieldComponent {
    @Input() field: CorpusField;
    @Input() document: FoundDocument;
    @Input() showEntities: boolean;
}
