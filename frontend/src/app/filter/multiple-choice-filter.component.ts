import { Component, Input, OnInit, OnChanges } from '@angular/core';

import * as _ from "lodash";

import { BaseFilterComponent } from './base-filter.component';
import { SearchFilter, MultipleChoiceFilterData, AggregateResult } from '../models';

@Component({
  selector: 'ia-multiple-choice-filter',
  templateUrl: './multiple-choice-filter.component.html',
  styleUrls: ['./multiple-choice-filter.component.scss']
})
export class MultipleChoiceFilterComponent extends BaseFilterComponent<MultipleChoiceFilterData> implements OnChanges {
    @Input() public optionsAndCounts: AggregateResult[];
    
    ngOnChanges() {
        this.provideFilterData();
    }

    getDisplayData(filter: SearchFilter<MultipleChoiceFilterData>) {
        let data = filter.currentData;
        let options = [];
        if (this.optionsAndCounts) {
            options = _.sortBy(this.optionsAndCounts.map(x => {
                return { 'label': x.key, 'value': encodeURIComponent(x.key), 'doc_count': x.doc_count };
            }), o => o.label);
        }
        else options = _.sortBy(data.options.map(x => { return { 'label': x, 'value': encodeURIComponent(x) } }), o => o.label);
        if (options.length === 0) {
            this.grayedOut = true;
        }
        return { options: options, selected: data.selected };
    }

    getFilterData(): SearchFilter<MultipleChoiceFilterData> {
        this.filter.currentData = {
            filterType: "MultipleChoiceFilter",
            options: this.data.options,
            selected: this.data.selected
        };
        return this.filter;
    }


}
