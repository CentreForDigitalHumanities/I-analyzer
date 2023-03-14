import { Component, OnInit } from '@angular/core';

import { SearchFilter, RangeFilterData, RangeFilter } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.scss']
})
export class RangeFilterComponent extends BaseFilterComponent<RangeFilter> implements OnInit {
    data: [number, number];

    ngOnInit() {
        this.provideFilterData();
    }

    getDisplayData(filter: RangeFilter) {
        return [filter.currentData.min, filter.currentData.max];
    }

    getFilterData(): RangeFilterData {
        return {
            min: this.data[0],
            max: this.data[1],
        };
    }

}
