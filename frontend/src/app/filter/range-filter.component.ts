import { Component, OnInit, OnChanges } from '@angular/core';

import { SearchFilter, RangeFilterData } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.scss']
})
export class RangeFilterComponent extends BaseFilterComponent<RangeFilterData> implements OnChanges {

    ngOnChanges() {
        console.log(this.filter);
        this.provideFilterData();
    }

    getDisplayData(filter: SearchFilter<RangeFilterData>) {
        let data = filter.currentData;
        return [data.min, data.max];
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
