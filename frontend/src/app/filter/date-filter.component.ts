import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';

import { DateFilterData, DateFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends BaseFilterComponent<DateFilter> implements OnInit {
    public minDate: Date;
    public maxDate: Date;
    public minYear: number;
    public maxYear: number;

    ngOnInit() {
        this.provideFilterData();
        this.minDate = this.filter.filter.defaultData.min;
        this.maxDate = this.filter.filter.defaultData.max;
        this.minYear = this.minDate.getFullYear();
        this.maxYear = this.maxDate.getFullYear();
    }

    getDisplayData(filter: DateFilter) {
        const data = filter.currentData;
        return {
            min: new Date(data.min),
            max: new Date(data.max),
        };
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    getFilterData(): DateFilterData {
        return this.data;
    }
}
