import { Component, Input, OnInit, OnChanges } from '@angular/core';

import * as _ from 'lodash';

import { BaseFilterComponent } from './base-filter.component';
import { SearchFilter, AggregateResult, PotentialFilter, MultipleChoiceFilter } from '../models';

@Component({
  selector: 'ia-multiple-choice-filter',
  templateUrl: './multiple-choice-filter.component.html',
  styleUrls: ['./multiple-choice-filter.component.scss']
})
export class MultipleChoiceFilterComponent extends BaseFilterComponent<string[], MultipleChoiceFilter> {
    options: { label: string; value: string; doc_count: number }[];

    @Input()
    set optionsAndCounts(value: AggregateResult[]) {
        this.options = _.sortBy(
            value.map(x => ({ label: x.key, value: encodeURIComponent(x.key), doc_count: x.doc_count })),
            o => o.label
        );
    };

    onFilterSet(filter: MultipleChoiceFilter): void {}

    getDisplayData(filterData: string[]): string[] {
        return filterData;
    }

    getFilterData(data: string[]): string[] {
        return data;
    }
}
