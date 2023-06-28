import { Component } from '@angular/core';

import { RangeFilterData, RangeFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'ia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.scss']
})
export class RangeFilterComponent extends BaseFilterComponent<RangeFilterData> {
    min: number;
    max: number;

    data$: Observable<[number, number]>;

    onFilterSet(filter: RangeFilter): void {
        this.min = filter.defaultData.min;
        this.max = filter.defaultData.max;

        this.data$ = this.filter?.data.asObservable().pipe(
            tap(data => console.log(data)),
            map(this.getDisplayData)
        );
    }

    getDisplayData(filterData: RangeFilterData): [number, number] {
        return [filterData.min, filterData.max];
    }

    getFilterData(value: [number, number]): RangeFilterData {
        return {
            min: value[0],
            max: value[1],
        };
    }

}
