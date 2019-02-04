import { Component, Input, OnInit } from '@angular/core';

import { QueryModel, searchFilterDataToParam } from '../models/index'

@Component({
    selector: '[history-query-display]',
    templateUrl: './history-query-display.component.html',
    styleUrls: ['./history-query-display.component.scss']
})
export class HistoryQueryDisplayComponent implements OnInit {
    @Input() public timeStamp: Date;
    @Input() public queryModel: QueryModel;
    @Input() public numberResults: number;
    @Input() public displayCorpora: boolean;
    @Input() public corpus: string;

    public formattedFilters: string;

    constructor() { }

    ngOnInit() {
        this.formattedFilters = '';
        if (typeof this.queryModel=="string") {
            this.queryModel = JSON.parse(this.queryModel);
        }

        if (this.queryModel.filters.length>0) {
            this.queryModel.filters.forEach(filter => {
                this.formattedFilters += filter.filterName + ": <b>" + filter.fieldName + "</b>: " +
                searchFilterDataToParam(filter) + "<br>"
            });
        }


    }

}
