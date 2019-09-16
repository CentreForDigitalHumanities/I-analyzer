import { Component, OnInit } from '@angular/core';

import * as _ from "lodash";

import { SearchFilterComponent } from '../search';
import { SearchFilter, MultipleChoiceFilterData } from '../models';

@Component({
  selector: 'ia-multiple-choice-filter',
  templateUrl: './multiple-choice-filter.component.html',
  styleUrls: ['./multiple-choice-filter.component.scss']
})
export class MultipleChoiceFilterComponent extends SearchFilterComponent implements OnInit {

    ngOnInit() {
    }

    getDisplayData(filter: SearchFilter) {
        let data = filter.currentData as MultipleChoiceFilterData;
        let options = [];
        if (data.optionsAndCounts) {
            options = _.sortBy(data.optionsAndCounts.map(x => {
                return { 'label': x.key, 'value': encodeURIComponent(x.key), 'doc_count': x.doc_count };
            }), o => o.label);
        }
        else options = _.sortBy(data.options.map(x => { return { 'label': x, 'value': encodeURIComponent(x) } }), o => o.label);
        if (options.length === 0) {
            this.greyedOut = true;
        }
        return { options: options, selected: data.selected };
    }

    getFilterData(): SearchFilter {
        this.filter.currentData = {
            filterType: "MultipleChoiceFilter",
            options: this.data.options,
            selected: this.data.selected
        };
        return this.filter;
    }


}
