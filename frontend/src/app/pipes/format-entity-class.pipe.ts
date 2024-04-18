
import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({
    name: 'formatEntityClass'
})
export class FormatEntityClassPipe implements PipeTransform {
    constructor() {
    }

    /**
     * Transform field with annotated entities
     *
     * @param document FoundDocument holding the actual data
     */
    transform(entityName: string) {
        return `entity-${entityName.toLowerCase().slice(0,3)}`;
    }

}
