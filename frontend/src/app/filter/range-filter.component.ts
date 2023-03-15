import { Component, OnInit } from '@angular/core';

import { RangeFilterData, RangeFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.scss']
})
export class RangeFilterComponent extends BaseFilterComponent<[number, number], RangeFilter> {
    min: number;
    max: number;

    onFilterSet(filter: RangeFilter): void {
        this.min = filter.defaultData.min;
        this.max = filter.defaultData.max;
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
