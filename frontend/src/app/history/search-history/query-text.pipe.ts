import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'formatQueryText'})
export class QueryTextPipe implements PipeTransform {
    transform(query: string): string {
        let queryModel = JSON.parse(query);
        return queryModel.queryText
    }
}