import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { FoundDocument } from '../models';
import * as _ from 'lodash';

@Pipe({
    name: 'entity'
})
export class EntityPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {
    }

    /**
     * Transform field with annotated entities
     *
     * @param document FoundDocument holding the actual data
     */
    transform(annotations$: Observable<{[fieldName: string]: string}[]>, document: FoundDocument, fieldName: string) {
        const newText = annotations$[fieldName];
        return newText || document.fieldValues[fieldName];
    }

}
