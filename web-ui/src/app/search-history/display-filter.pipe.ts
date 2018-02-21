import { Pipe, PipeTransform } from '@angular/core';

import { QueryModel, searchFilterDataToParam } from '../models/index'

@Pipe({name: 'displayFilter'})
export class DisplayFilterPipe implements PipeTransform {
    private returnHtml: string = '';

    transform(queryModel: QueryModel): string {
        let filters = JSON.parse(queryModel).filters;
        if filters {
	        filters.forEach(filter => {
	            this.returnHtml += filter.filterName + ": <b>" + filter.fieldName + "</b>: " + 
	            searchFilterDataToParam(filter) + "<br>"
	        });
	    }

        return this.returnHtml;
    }

}