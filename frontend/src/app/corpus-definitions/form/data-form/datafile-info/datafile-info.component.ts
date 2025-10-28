import { Component, Input } from '@angular/core';
import { APICorpusDefinitionField, CorpusDataFile, FIELD_TYPE_OPTIONS } from '@models/corpus-definition';

@Component({
    selector: 'ia-datafile-info',
    templateUrl: './datafile-info.component.html',
    styleUrl: './datafile-info.component.scss',
    standalone: false,
})
export class DatafileInfoComponent {
    @Input({ required: true }) currentDataFile!: CorpusDataFile;

    fieldTypeLabel(value: APICorpusDefinitionField['type']) {
        return FIELD_TYPE_OPTIONS.find((option) => option.value == value)
            ?.label;
    }
}
