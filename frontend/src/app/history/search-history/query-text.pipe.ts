import { Pipe, PipeTransform } from '@angular/core';
import { QueryModel } from '@models';

@Pipe({
    name: 'formatQueryText',
    standalone: false
})
export class QueryTextPipe implements PipeTransform {
    transform(queryModel: QueryModel): string {
        return queryModel.queryText;
    }
}
