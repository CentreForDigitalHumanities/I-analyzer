import { Component, Input, OnInit } from '@angular/core';

import { QueryModel } from '../../models/index';

@Component({
    selector: '[ia-query-filters]',
    templateUrl: './query-filters.component.html',
    styleUrls: ['./query-filters.component.scss']
})
export class QueryFiltersComponent implements OnInit {
    @Input() public queryModel: QueryModel;
    public formattedFilters: {
        name: string;
        formattedData: string | string[]; }[];

    constructor() { }

    ngOnInit() {
        if (this.queryModel.filters?.length>0) {
            this.formattedFilters = this.queryModel.filters.map(filter => ({
                name: filter.corpusField.name,
                formattedData: filter.dataToString(filter.currentData)
            }));
        }
    }

}
