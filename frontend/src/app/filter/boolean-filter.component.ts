import { Component, OnInit } from '@angular/core';

import { SearchFilterComponent } from '../search';
import { SearchFilter, BooleanFilterData } from '../models';

@Component({
  selector: 'ia-boolean-filter',
  templateUrl: './boolean-filter.component.html',
  styleUrls: ['./boolean-filter.component.scss']
})
export class BooleanFilterComponent extends SearchFilterComponent implements OnInit {

    ngOnInit() {
    }

    getDisplayData(filter: SearchFilter) {
        let data = filter.currentData as BooleanFilterData;
        return data.checked;
    }

    getFilterData(): SearchFilter {
        this.filter.currentData = {
            filterType: "BooleanFilter",
            checked: this.data
        };
        return this.filter;
    }   

}
