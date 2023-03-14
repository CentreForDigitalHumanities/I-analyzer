/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Input, OnChanges } from '@angular/core';

import * as _ from 'lodash';

import { PotentialFilter, Corpus, SearchFilter, QueryModel, MultipleChoiceFilterOptions, AggregateData } from '../models/index';
import { SearchService } from '../services';

@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent implements OnChanges {
    @Input() public corpus: Corpus;
    @Input() queryModel: QueryModel;

    public potentialFilters: PotentialFilter[] = [];

    public showFilters: boolean;
    public grayOutFilters: boolean;

    public multipleChoiceData: {
        [fieldName: string]: any[];
    } = {};

    constructor(
        private searchService: SearchService,) {
    }

    get activeFilters(): SearchFilter[] {
        return this.queryModel.filters;
    }

    ngOnChanges() {
        if (this.corpus && this.queryModel && !this.potentialFilters) {
            this.potentialFilters = this.corpus.fields.map(field => new PotentialFilter(field, this.queryModel));
            this.queryModel.update.subscribe(this.onQueryModelUpdate.bind(this));
        }
    }

    onQueryModelUpdate() {
        this.aggregateSearchForMultipleChoiceFilters();

    }

    /**
     * For all multiple choice filters, get the bins and counts
     * Exclude the filter itself from the aggregate search
     * Save results in multipleChoiceData, which is structured as follows:
     * fieldName1: [{key: option1, doc_count: 42}, {key: option2, doc_count: 3}],
     * fieldName2: [etc]
     */
    private aggregateSearchForMultipleChoiceFilters() {
        const multipleChoiceFilters = this.potentialFilters.filter(f =>
            f.corpusField.filterOptions?.name === 'MultipleChoiceFilter');

        const aggregateResultPromises = multipleChoiceFilters.map(filter =>
            this.getMultipleChoiceFilterOptions(filter));
        Promise.all(aggregateResultPromises).then(results => {
            results.forEach( r =>
                this.multipleChoiceData[Object.keys(r)[0]] = Object.values(r)[0]
            );
            // if multipleChoiceData is empty, gray out all filters
            if (multipleChoiceFilters && multipleChoiceFilters.length !== 0) {
                this.grayOutFilters = this.multipleChoiceData[multipleChoiceFilters[0].corpusField.name].length === 0;
            }
        });
    }

    private async getMultipleChoiceFilterOptions(filter: PotentialFilter): Promise<AggregateData> {
        const optionCount = (filter.corpusField.filterOptions as MultipleChoiceFilterOptions).option_count;
        const aggregator = {name: filter.corpusField.name, size: optionCount};
        const queryModel = this.queryModel.clone();
        queryModel.removeFilter(filter.filter); // exclude the choices for this filter
        return this.searchService.aggregateSearch(this.corpus, queryModel, [aggregator]).then(
            response => response.aggregations);
    }

    toggleFilter(filter: PotentialFilter) {
        filter.toggle();
    }

    resetFilter(filter: PotentialFilter) {
        filter.reset();
    }

    public toggleActiveFilters() {
        if (this.activeFilters.length) {
            this.potentialFilters.forEach(filter => filter.deactivate());
        } else {
            // if we don't have active filters, set all filters to active which don't use default data
            const filtersWithSettings = this.potentialFilters.filter(pFilter =>
                pFilter.filter.currentData === pFilter.filter.defaultData);
            filtersWithSettings.forEach(filter => filter.toggle());
        }
    }

    public resetAllFilters() {
        this.activeFilters.forEach(filter => {
            filter.reset();
        });
    }

}
