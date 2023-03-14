import { Component, Input, OnInit, OnChanges } from '@angular/core';

import * as _ from 'lodash';

import { BaseFilterComponent } from './base-filter.component';
import { SearchFilter, AggregateResult, PotentialFilter, MultipleChoiceFilter } from '../models';

@Component({
  selector: 'ia-multiple-choice-filter',
  templateUrl: './multiple-choice-filter.component.html',
  styleUrls: ['./multiple-choice-filter.component.scss']
})
export class MultipleChoiceFilterComponent extends BaseFilterComponent<MultipleChoiceFilter> {
    @Input() potentialFilter: PotentialFilter;
    @Input() public optionsAndCounts: AggregateResult[];

    data: {
        options: string[];
        selected: string[];
    } = {
        options: [], selected: []
    };

    getDisplayData(filter: MultipleChoiceFilter) {
        let options = [];
        if (this.optionsAndCounts) {
            options = _.sortBy(
                this.optionsAndCounts.map(x => ({ label: x.key, value: encodeURIComponent(x.key), doc_count: x.doc_count })),
                o => o.label
            );
        } else {
            options = [1, 2, 3];
        } // dummy array to make sure the component loads
        return { options, selected: filter.currentData };
    }

    getFilterData(): string[] {
        return this.data.selected;
    }


}
