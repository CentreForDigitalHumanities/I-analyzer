import { Component, Input } from '@angular/core';
import { CorpusField, FoundDocument } from '@models';

@Component({
    selector: 'ia-metadata-field',
    templateUrl: './metadata-field.component.html',
    styleUrl: './metadata-field.component.scss',
    standalone: false
})
export class MetadataFieldComponent {
    @Input() field: CorpusField;
    @Input() document: FoundDocument;

}
