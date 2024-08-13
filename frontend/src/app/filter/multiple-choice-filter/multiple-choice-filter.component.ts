import { Component } from '@angular/core';

import * as _ from 'lodash';

import { TermsAggregator, TermsResult } from '@models/aggregation';
import { SearchService } from '@services';
import { MultipleChoiceFilter, MultipleChoiceFilterOptions } from '@models';
import { BaseFilterComponent } from '../base-filter.component';

@Component({
    selector: 'ia-multiple-choice-filter',
    templateUrl: './multiple-choice-filter.component.html',
    styleUrls: ['./multiple-choice-filter.component.scss']
})
export class MultipleChoiceFilterComponent extends BaseFilterComponent<MultipleChoiceFilter> {
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
            const aggregator = new TermsAggregator(this.filter.corpusField, optionCount);
            const queryModel = this.queryModel.clone();
            queryModel.filterForField(this.filter.corpusField).deactivate();

            const parseOption = (item: TermsResult) => ({
                label: item.key, value: item.key, doc_count: item.doc_count
            });
            this.searchService.aggregateSearch(
                queryModel.corpus, queryModel, aggregator
            ).then(result =>
                this.options = _.sortBy(result.map(parseOption), option => option.label)
            ).catch(() =>
                this.options = []
            );
        }
    }
}
