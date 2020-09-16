import { Component, DoCheck, OnInit } from '@angular/core';

import { BaseFilterComponent } from './base-filter.component';
import { SearchFilter, BooleanFilterData } from '../models';

@Component({
  selector: 'ia-boolean-filter',
  templateUrl: './boolean-filter.component.html',
  styleUrls: ['./boolean-filter.component.scss']
})
export class BooleanFilterComponent extends BaseFilterComponent<BooleanFilterData> implements DoCheck, OnInit {

    ngOnInit() {
        this.provideFilterData();
    }

    ngDoCheck() {
        if (this.filter.reset) {
            this.filter.reset = false;
            this.provideFilterData();
        }
    }

    getDisplayData(filter: SearchFilter<BooleanFilterData>) {
        let data = filter.currentData;
        return { checked: data.checked }
    }

    getFilterData(): SearchFilter<BooleanFilterData> {
        this.filter.currentData = {
            filterType: "BooleanFilter",
            checked: this.data.checked
        };
        return this.filter;
    }   

}
