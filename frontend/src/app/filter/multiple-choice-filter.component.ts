import { Component } from '@angular/core';

import * as _ from 'lodash';

import { BaseFilterComponent } from './base-filter.component';
import { MultipleChoiceFilterOptions } from '../models';
import { SearchService } from '../services';

@Component({
  selector: 'ia-multiple-choice-filter',
  templateUrl: './multiple-choice-filter.component.html',
  styleUrls: ['./multiple-choice-filter.component.scss']
})
export class MultipleChoiceFilterComponent extends BaseFilterComponent<string[]> {
    options: { label: string; value: string; doc_count: number }[] = [];

    constructor(private searchService: SearchService) {
        super();
    }

    onFilterSet(): void {
        this.getOptions();
    }

    onQueryModelUpdate(): void {
        this.getOptions();
    }

    private async getOptions(): Promise<void> {
        if (this.filter && this.queryModel) {
            const optionCount = (this.filter.corpusField.filterOptions as MultipleChoiceFilterOptions).option_count;
            const aggregator = {name: this.filter.corpusField.name, size: optionCount};
            const queryModel = this.queryModel.clone();
            queryModel.filterForField(this.filter.corpusField).deactivate();
            this.searchService.aggregateSearch(queryModel.corpus, queryModel, [aggregator]).then(
                response => response.aggregations[this.filter.corpusField.name]).then(aggregations =>
                    this.options = _.sortBy(
                        aggregations.map(x => ({ label: x.key, value: x.key, doc_count: x.doc_count })),
                        o => o.label
                    )
                ).catch(() => this.options = []);

        }
    }
}
