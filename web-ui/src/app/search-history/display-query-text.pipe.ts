import { Pipe, PipeTransform } from '@angular/core';

import { QueryModel } from '../models/index'

@Pipe({name: 'displayQueryText'})
export class DisplayQueryTextPipe implements PipeTransform {

    transform(queryModel: QueryModel): string {
        let queryText = JSON.parse(queryModel).queryText;
        return queryText;
    }

}