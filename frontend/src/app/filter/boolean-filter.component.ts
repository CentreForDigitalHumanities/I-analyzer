import { Component, OnInit } from '@angular/core';

import { BaseFilterComponent } from './base-filter.component';
import { SearchFilter, BooleanFilterData, SearchFilterData } from '../models';

@Component({
  selector: 'ia-boolean-filter',
  templateUrl: './boolean-filter.component.html',
  styleUrls: ['./boolean-filter.component.scss']
})
export class BooleanFilterComponent extends BaseFilterComponent<BooleanFilterData> implements OnInit {

    ngOnInit() {
        this.provideFilterData();
    }

    getDisplayData(filter: SearchFilter<BooleanFilterData>) {
        let data = filter.currentData;
        return data.checked;
    }

    getFilterData(): SearchFilter<BooleanFilterData> {
        this.filter.currentData = {
            filterType: "BooleanFilter",
            checked: this.data
        };
        return this.filter;
    }   

}
