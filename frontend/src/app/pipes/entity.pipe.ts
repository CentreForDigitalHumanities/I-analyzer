import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CorpusField, FoundDocument } from '../models';
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
    transform(field: CorpusField, document: FoundDocument) {
        const newText = document.annotations$.map(
            (annotation)=> _.set(document.fieldValues, _.keys(annotation)[0], _.values(annotation)[0]));
        return newText;
    }

}
