import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
    name: 'keyword',
    standalone: false
})
export class KeywordPipe implements PipeTransform {
    constructor() {}

    transform(content: any): string {
        if (_.isArray(content)) {
            return content.map(String).join(', ');
        } else {
            return String(content);
        }

    }

}
