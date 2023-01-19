import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'formatQueryText'})
export class QueryTextPipe implements PipeTransform {
    transform(query: string): string {
        const queryModel = JSON.parse(query);
        return queryModel.queryText;
    }
}
