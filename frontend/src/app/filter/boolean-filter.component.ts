import { Component, DoCheck, OnInit } from '@angular/core';

import { BaseFilterComponent } from './base-filter.component';
import { BooleanFilter } from '../models';

@Component({
  selector: 'ia-boolean-filter',
  templateUrl: './boolean-filter.component.html',
  styleUrls: ['./boolean-filter.component.scss']
})
export class BooleanFilterComponent extends BaseFilterComponent<boolean, BooleanFilter> {
    data: boolean;

    onFilterSet(filter: BooleanFilter) {}

    getDisplayData(filterData: boolean): boolean {
        return filterData;
    }

    getFilterData(data: boolean): boolean {
        return data;
    }

}
