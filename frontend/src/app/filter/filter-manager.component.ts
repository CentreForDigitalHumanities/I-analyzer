import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import * as _ from 'lodash';
import { Subject } from 'rxjs';

import { AggregateData, Corpus, MultipleChoiceFilterData, QueryModel, SearchFilter, SearchFilterData, CorpusField } from '../models/index';
import { SearchService } from '../services';

@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent implements OnInit, OnChanges {
    @Input() public corpus: Corpus;
    @Input() private queryModel: QueryModel;

    @Output('filtersChanged')
    public filtersChangedEmitter = new EventEmitter<SearchFilter<SearchFilterData> []>();

    inputChanged = new Subject<void>();

    public searchFilters: SearchFilter<SearchFilterData> [] = [];
    public activeFilters: SearchFilter<SearchFilterData> [] = [];

    public adHocFilterFields: CorpusField[] = [];

    public showFilters: boolean;
    public grayOutFilters: boolean;

    public multipleChoiceData: Object = {};

    constructor(private searchService: SearchService) {
     }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['corpus']) {
            this.searchFilters = this.corpus.fields.filter(field => field.searchFilter).map(field => field.searchFilter);
            this.setAdHocFilters();
            this.activeFilters = [];
            if (changes['corpus'].previousValue !== undefined ) {
                this.searchFilters.forEach( filter => filter.currentData = filter.defaultData);
            }
        } else if (changes.queryModel) {
            this.setAdHocFilters();
        }
        this.aggregateSearchForMultipleChoiceFilters();
        this.inputChanged.next();
    }

    /**
     * make ad hoc filters for any filters in the query model
     * that are not normally listed in the interface
     */
    private setAdHocFilters() {
        if (this.queryModel.filters && this.corpus) {
            const fieldsWithFilters = this.corpus.fields.filter(field => field.searchFilter).map(field => field.name);
            const adHoc = this.queryModel.filters.filter(f => !fieldsWithFilters.includes(f.fieldName));
            adHoc.forEach(filter => {
                if (!this.searchFilters.find(f => f.fieldName === filter.fieldName)) {
                    this.searchFilters.push(filter);
                }
            });

            this.adHocFilterFields = adHoc.map(filter => {
                const corpusField = _.cloneDeep(this.corpus.fields.find(field => field.name === filter.fieldName));
                corpusField.searchFilter = filter;
                return corpusField;
            });
        }
    }

    /**
     * For all multiple choice filters, get the bins and counts
     * Exclude the filter itself from the aggregate search
     * Save results in multipleChoiceData, which is structured as follows:
     * fieldName1: [{key: option1, doc_count: 42}, {key: option2, doc_count: 3}],
     * fieldName2: [etc]
     */
    private aggregateSearchForMultipleChoiceFilters() {
        const multipleChoiceFilters = this.searchFilters.filter(f => !f.adHoc && f.defaultData.filterType === 'MultipleChoiceFilter');

        const aggregateResultPromises = multipleChoiceFilters.map(filter => this.getMultipleChoiceFilterOptions(filter));
        Promise.all(aggregateResultPromises).then(results => {
            results.forEach( r =>
                this.multipleChoiceData[Object.keys(r)[0]] = Object.values(r)[0]
            );
            // if multipleChoiceData is empty, gray out all filters
            if (multipleChoiceFilters.length != 0) {
this.grayOutFilters = this.multipleChoiceData[multipleChoiceFilters[0].fieldName].length === 0;
}
        });
    }

    async getMultipleChoiceFilterOptions(filter: SearchFilter<SearchFilterData>): Promise<AggregateData> {
        let filters = _.cloneDeep(this.searchFilters.filter(f => f.useAsFilter === true));
        // get the filter's choices, based on all other filters' choices, but not this filter's choices
        if (filters.length > 0) {
            const index = filters.findIndex(f => f.fieldName === filter.fieldName);
            if (index >= 0) {
                filters.splice(index, 1);
            }
        } else {
 filters = null;
}
        const defaultData = filter.defaultData as MultipleChoiceFilterData;
        const aggregator = {name: filter.fieldName, size: defaultData.optionCount};
        const queryModel = this.searchService.createQueryModel(this.queryModel.queryText, this.queryModel.fields, filters);
        return this.searchService.aggregateSearch(this.corpus, queryModel, [aggregator]).then(results => results.aggregations, error => {
            console.trace(error, aggregator);
            return {};
        });
    }

    /**
     * Event triggered from filter components
     *
     * @param filterData
     */
    public updateFilterData(filter: SearchFilter<SearchFilterData>) {
        const index = this.searchFilters.findIndex(f => f.fieldName === filter.fieldName);
        this.searchFilters[index] = filter;
        this.filtersChanged();
    }

    public toggleActiveFilters() {
        this.searchFilters.forEach(filter => filter.useAsFilter = false);
        this.filtersChanged();
    }

    public resetAllFilters() {
        this.searchFilters.forEach(filter => {
            filter.currentData = filter.defaultData;
            filter.reset = true;
        });
        this.toggleActiveFilters();
    }

    public filtersChanged() {
        this.activeFilters = this.searchFilters.filter(filter => filter.useAsFilter);
        this.setAdHocFilters();
        this.filtersChangedEmitter.emit(this.activeFilters);
    }

    toggleFilter(filter: SearchFilter<SearchFilterData>) {
        filter.useAsFilter = !filter.useAsFilter;
        this.filtersChanged();
    }

    resetFilter(filter: SearchFilter<SearchFilterData>) {
        filter.useAsFilter = false;
        filter.currentData = filter.defaultData;
        filter.reset = true;
        this.filtersChanged();
    }

}
