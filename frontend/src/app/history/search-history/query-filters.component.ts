import { Component, Input, OnInit } from '@angular/core';
import { ParamService } from '../../services';

import { QueryModel } from '../../models/index';
import { searchFilterDataToParam } from '../../utils/params';

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

    constructor(private paramService: ParamService) { }

    ngOnInit() {
        if (typeof this.queryModel=='string') {
            this.queryModel = JSON.parse(this.queryModel);
        }

        if (this.queryModel.filters?.length>0) {
            this.formattedFilters = this.queryModel.filters.map(filter => {
                return {name: filter.fieldName, formattedData: searchFilterDataToParam(filter)}
            });
        }
    }

}
