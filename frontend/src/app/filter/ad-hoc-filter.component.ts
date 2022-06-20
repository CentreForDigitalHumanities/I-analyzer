import { Component, Input, OnInit } from '@angular/core';
import { SearchFilter, SearchFilterData } from '../models';
import { BaseFilterComponent } from './base-filter.component';

@Component({
  selector: 'ia-ad-hoc-filter',
  templateUrl: './ad-hoc-filter.component.html',
  styleUrls: ['./ad-hoc-filter.component.scss']
})
export class AdHocFilterComponent extends BaseFilterComponent<SearchFilterData> implements OnInit {
    data: { value: any};

    ngOnInit() {
        this.data = this.getDisplayData(this.filter);
    }

    getValue(data: SearchFilterData) {
        switch (data.filterType) {
            case 'BooleanFilter':
                return data.checked;
            case 'DateFilter':
                return data.min; // can return either: min == max for ad hoc filters
            case 'MultipleChoiceFilter':
                return data.selected[0]; // only one value for ad hoc filters
            case 'RangeFilter':
                return data.min;
        }
    }

    getDisplayData(filter: SearchFilter<SearchFilterData>) {
        return { value: this.getValue( filter.currentData) };
    }

    getFilterData(): SearchFilter<SearchFilterData> {
        return undefined;
    }

}
