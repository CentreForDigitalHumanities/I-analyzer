import { Component, Input } from '@angular/core';
import { CorpusField, FoundDocument } from '@models';
import { splitParagraphs } from '../pipes/paragraph.pipe';
import { entityIcons } from '@app/shared/icons';
import _ from 'lodash';

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

    entityIcons = entityIcons;

    splitParagraphs = splitParagraphs;

    annotationName(annotation: string) {
        const keys = {
            PER: 'person',
            LOC: 'location',
            ORG: 'organization',
            MISC: 'miscellaneous',
        };
        return _.get(keys, annotation);
    }

    annotationIcon(annotation: string) {
        return _.get(entityIcons, this.annotationName(annotation));
    }
}
