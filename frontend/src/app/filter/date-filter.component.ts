import { Component } from '@angular/core';
import * as _ from 'lodash';

import { DateFilterData, DateFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'ia-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends BaseFilterComponent<DateFilterData> {
    public minDate: Date;
    public maxDate: Date;

    public selectedMinDate: BehaviorSubject<Date>;
    public selectedMaxDate: BehaviorSubject<Date>;

    onFilterSet(filter: DateFilter): void {
        this.minDate = filter.defaultData.min;
        this.maxDate = filter.defaultData.max;

        this.selectedMinDate = new BehaviorSubject(this.minDate);
        this.selectedMaxDate = new BehaviorSubject(this.maxDate);

        combineLatest([this.selectedMinDate, this.selectedMaxDate]).pipe(
            tap(value => console.log(value))
        ).subscribe(([min, max]) =>
            this.update({min, max})
        );
    }
}
