import { Pipe, PipeTransform } from '@angular/core';

import { QueryModel, SearchFilterData, searchFilterDataToParam } from '../models/index'

@Pipe({name: 'displayFilter'})
export class DisplayFilterPipe implements PipeTransform {
    private returnHtml: string;
    private filters: SearchFilterData[];

    transform(queryModel: QueryModel): string {
        this.returnHtml = '';
        if (typeof queryModel=="string") {
            this.filters = JSON.parse(queryModel).filters;
        }
        else {
            this.filters = queryModel.filters;
        }
        if (this.filters.length>0) {
	        this.filters.forEach(filter => {
	            this.returnHtml += filter.filterName + ": <b>" + filter.fieldName + "</b>: " + 
	            searchFilterDataToParam(filter) + "<br>"
	        });
	    }

        return this.returnHtml;
    }

}