import { Component } from '@angular/core';
import * as _ from 'lodash';

import { DateFilterData, DateFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends BaseFilterComponent<DateFilterData> {
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

    updateProperty(property: 'min'|'max', date: Date) {
        const value = _.merge(_.clone(this.data), {[property]: date});
        this.update(value);
    }

}
