import { Component, DoCheck, OnInit } from '@angular/core';

import { BaseFilterComponent } from './base-filter.component';
import { BooleanFilter } from '../models';

@Component({
  selector: 'ia-boolean-filter',
  templateUrl: './boolean-filter.component.html',
  styleUrls: ['./boolean-filter.component.scss']
})
export class BooleanFilterComponent extends BaseFilterComponent<BooleanFilter> {
    data: boolean;

    getDisplayData(filter: BooleanFilter) {
        const data = filter.currentData;
        return data;
    }

    getFilterData(): boolean {
        return this.data;
    }

}
