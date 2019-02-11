import { Component, Input, OnInit } from '@angular/core';

import { QueryModel, searchFilterDataToParam } from '../models/index'

@Component({
    selector: '[ia-query-filters]',
    templateUrl: './query-filters.component.html',
    styleUrls: ['./query-filters.component.scss']
})
export class QueryFiltersComponent implements OnInit {
    @Input() public queryModel: QueryModel;
    private formattedFilters: { 
        name: string, 
        formattedData: string | string[] }[];
    
    constructor() { }

    ngOnInit() {
        if (typeof this.queryModel=="string") {
            this.queryModel = JSON.parse(this.queryModel);
        }

        if (this.queryModel.filters.length>0) {
            this.formattedFilters = this.queryModel.filters.map(filter => {
                return {name: filter.fieldName, formattedData: searchFilterDataToParam(filter)}
            });
        }
    }

}
