import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';

import { SearchFilter, DateFilterData } from '../models';
import { SearchFilterComponent } from './search-filter.component';

@Component({
  selector: 'ia-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends SearchFilterComponent implements OnInit {
    public minDate: Date;
    public maxDate: Date;
    public minYear: number;
    public maxYear: number;

    ngOnInit() {
        this.provideFilterData();
        if (this.filter.defaultData.filterType === 'DateFilter') {
            this.minDate = new Date(this.filter.defaultData.min);
            this.maxDate = new Date(this.filter.defaultData.max);
            this.minYear = this.minDate.getFullYear();
            this.maxYear = this.maxDate.getFullYear();
        }
    }

    getDisplayData(filter: SearchFilter) {
        let data = this.filter.currentData as DateFilterData;
        return {
            min: new Date(data.min),
            max: new Date(data.max),
            minYear: this.minYear,
            maxYear: this.maxYear
        }
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    getFilterData(): SearchFilter {
        this.filter.currentData = {
            filterType: "DateFilter",
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
