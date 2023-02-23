import { Component, DoCheck, OnChanges, OnInit } from '@angular/core';

import * as moment from 'moment';

import { SearchFilter, DateFilterData } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends BaseFilterComponent<DateFilterData> implements DoCheck, OnInit {
    public minDate: Date;
    public maxDate: Date;
    public minYear: number;
    public maxYear: number;

    ngOnInit() {
        this.provideFilterData();
        this.minDate = new Date(this.filter.defaultData.min);
        this.maxDate = new Date(this.filter.defaultData.max);
        this.minYear = this.minDate.getFullYear();
        this.maxYear = this.maxDate.getFullYear();
    }

    ngDoCheck() {
        if (this.filter.reset) {
            this.filter.reset = false;
            this.provideFilterData();
        }
    }


    getDisplayData(filter: SearchFilter<DateFilterData>) {
        const data = filter.currentData;
        return {
            min: new Date(data.min),
            max: new Date(data.max),
            minYear: this.minYear,
            maxYear: this.maxYear
        };
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    getFilterData(): SearchFilter<DateFilterData> {
        this.filter.currentData = {
            filterType: 'DateFilter',
            min: this.formatDate(this.data.min),
            max: this.formatDate(this.data.max)
        };
        return this.filter;
    }

    /**
     * Return a string of the form 0123-04-25.
     */
    formatDate(date: Date): string {
        return moment(date).format().slice(0, 10);
    }

}
