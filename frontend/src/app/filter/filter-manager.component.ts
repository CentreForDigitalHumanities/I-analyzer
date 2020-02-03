import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import * as _ from "lodash";

import { AggregateData, Corpus, MultipleChoiceFilterData, QueryModel, SearchFilter, SearchFilterData } from '../models/index';
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
    public filtersChangedEmitter = new EventEmitter<SearchFilter<SearchFilterData> []>()

    public searchFilters: SearchFilter<SearchFilterData> [] = [];
    public activeFilters: SearchFilter<SearchFilterData> [] = [];
    
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
            if (changes['corpus'].previousValue != undefined ) {
                this.searchFilters.forEach( filter => filter.currentData = filter.defaultData);            
            }
        }
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
        let multipleChoiceFilters = this.searchFilters.filter(f => f.defaultData.filterType==="MultipleChoiceFilter");
        let aggregateResultPromises = multipleChoiceFilters.map(filter => this.getMultipleChoiceFilterOptions(filter));
        Promise.all(aggregateResultPromises).then(results => {
            results.forEach( r =>
                this.multipleChoiceData[Object.keys(r)[0]] = Object.values(r)[0]
            );
            // if multipleChoiceData is empty, gray out all filters
            this.grayOutFilters = this.multipleChoiceData[multipleChoiceFilters[0].fieldName].length == 0
        });
    }

    async getMultipleChoiceFilterOptions(filter: SearchFilter<SearchFilterData>): Promise<AggregateData> {
        let filters = _.cloneDeep(this.searchFilters.filter(f => f.useAsFilter===true));
        // get the filter's choices, based on all other filters' choices, but not this filter's choices
        if (filters.length>0) {
            let index = filters.findIndex(f => f.fieldName == filter.fieldName);
            if (index >= 0) {
                filters.splice(index, 1);
            }
        }
        else filters = null;
        let defaultData = filter.defaultData as MultipleChoiceFilterData;
        let aggregator = {name: filter.fieldName, size: defaultData.optionCount};
        let queryModel = this.searchService.createQueryModel(this.queryModel.queryText, this.queryModel.fields, filters);
        return this.searchService.aggregateSearch(this.corpus, queryModel, [aggregator]).then(results => {
            return results.aggregations;
        }, error => {
            console.trace(error, aggregator);
            return {};
        })
    }

    /**
     * Event triggered from filter components
     * @param filterData 
     */
    public updateFilterData(filter: SearchFilter<SearchFilterData>) {
        let index = this.searchFilters.findIndex(f => f.fieldName === filter.fieldName);
        this.searchFilters[index] = filter;
        this.filtersChanged();
    }

    public toggleActiveFilters() {
        this.searchFilters.forEach(filter => filter.useAsFilter=false);
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
