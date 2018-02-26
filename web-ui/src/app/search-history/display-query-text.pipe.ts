import { Pipe, PipeTransform } from '@angular/core';

import { QueryModel } from '../models/index'

@Pipe({name: 'displayQueryText'})
export class DisplayQueryTextPipe implements PipeTransform {
	private queryText: string;

    transform(queryModel: QueryModel): string {
        if (typeof queryModel=="string") {
        	this.queryText = JSON.parse(queryModel).queryText;
        }
        else {
        	this.queryText = queryModel.queryText;
        }
        return this.queryText;
    }

}