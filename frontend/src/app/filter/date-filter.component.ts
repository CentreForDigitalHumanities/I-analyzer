import { Component } from '@angular/core';
import * as _ from 'lodash';

import { DateFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
  selector: 'ia-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends BaseFilterComponent<DateFilter> {
    public minDate: Date;
    public maxDate: Date;

    public selectedMinDate: BehaviorSubject<Date>;
    public selectedMaxDate: BehaviorSubject<Date>;

    onFilterSet(filter: DateFilter): void {
        this.minDate = filter.defaultData.min;
        this.maxDate = filter.defaultData.max;

        this.selectedMinDate = new BehaviorSubject(filter.currentData.min);
        this.selectedMaxDate = new BehaviorSubject(filter.currentData.max);

        combineLatest([this.selectedMinDate, this.selectedMaxDate]).subscribe(([min, max]) =>
            this.update({min, max})
        );
    }

}
