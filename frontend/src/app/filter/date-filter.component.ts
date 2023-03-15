import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';

import { DateFilterData, DateFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends BaseFilterComponent<DateFilterData, DateFilter> {
    public minDate: Date;
    public maxDate: Date;
    public minYear: number;
    public maxYear: number;

    onFilterSet(filter: DateFilter): void {
        this.minDate = filter.defaultData.min;
        this.maxDate = filter.defaultData.max;
        this.minYear = this.minDate.getFullYear();
        this.maxYear = this.maxDate.getFullYear();
    }

    getDisplayData(filterData: DateFilterData) {
        return filterData;
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    getFilterData(data): DateFilterData {
        return data;
    }
}
