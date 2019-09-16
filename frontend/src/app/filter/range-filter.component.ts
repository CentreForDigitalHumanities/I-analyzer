import { Component, OnInit } from '@angular/core';

import { SearchFilter, RangeFilterData } from '../models';
import { SearchFilterComponent } from './search-filter.component';

@Component({
  selector: 'ia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.scss']
})
export class RangeFilterComponent extends SearchFilterComponent implements OnInit {

    ngOnInit() {
    }

    getDisplayData(filter: SearchFilter) {
        let data = filter.currentData as RangeFilterData;
        return [data.min, data.max];
    }

    getFilterData(): SearchFilter {   
        this.filter.currentData = {
            filterType: "RangeFilter",
            min: this.data[0],
            max: this.data[1]
        };
        return this.filter;
    }

}
