import { Component, Input, OnInit } from '@angular/core';

import { QueryModel } from '@models/index';

@Component({
    selector: '[ia-query-filters]',
    templateUrl: './query-filters.component.html',
    styleUrls: ['./query-filters.component.scss'],
    standalone: false
})
export class QueryFiltersComponent implements OnInit {
    @Input() public queryModel: QueryModel;
    public formattedFilters: {
        name: string;
        formattedData: string | string[]; }[];

    constructor() { }

    ngOnInit() {
        if (this.queryModel?.filters?.length>0) {
            this.formattedFilters = this.queryModel.activeFilters.map(filter => ({
                name: filter.displayName,
                formattedData: filter.dataToString(filter.currentData)
            }));
        }
    }

}
