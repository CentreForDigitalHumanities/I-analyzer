import { Component, Input, OnInit, OnChanges } from '@angular/core';

import { SearchFilter, RangeFilterData } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.scss']
})
export class RangeFilterComponent extends BaseFilterComponent<RangeFilterData> implements OnChanges, OnInit {
    ngOnInit() {
        this.provideFilterData();
    }

    ngOnChanges() {
        console.log("range filter changed");
    }

    getDisplayData(filter: SearchFilter<RangeFilterData>) {
        this.data = filter.currentData;
        return [this.data.min, this.data.max];
    }

    getFilterData(): SearchFilter<RangeFilterData> {   
        this.filter.currentData = {
            filterType: "RangeFilter",
            min: this.data[0],
            max: this.data[1]
        };
        return this.filter;
    }

}
