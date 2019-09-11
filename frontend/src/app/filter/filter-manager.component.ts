import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

import * as _ from "lodash";

import { AggregateData, Corpus, MultipleChoiceFilterData, QueryModel, searchFilterDataFromParam, SearchFilter } from '../models/index';
import { DataService, SearchService } from '../services';

@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent implements OnInit, OnChanges {
    @Input() private corpus: Corpus;
    @Input() private queryModel: QueryModel;

    @Output('filtersChanged')
    public filtersChangedEmitter = new EventEmitter<SearchFilter []>()

    public searchFilters: SearchFilter [] = [];
    public activeFilters: SearchFilter [] = [];
    
    public showFilters: boolean;

    constructor(private dataService: DataService, private searchService: SearchService) {
     }

    ngOnInit() {
    }

    ngOnChanges() {
        this.searchFilters = this.corpus.fields.filter(field => field.searchFilter).map(field => field.searchFilter);
        this.aggregateSearchForMultipleChoiceFilters();
    }

    private aggregateSearchForMultipleChoiceFilters() {
        let multipleChoiceFilters = this.searchFilters.filter(f => f.defaultData.filterType==="MultipleChoiceFilter");
        let aggregateResultPromises = multipleChoiceFilters.map(filter => this.getMultipleChoiceFilterOptions(filter));
        Promise.all(aggregateResultPromises).then(results => {
            results.forEach(result => {
                let filter = multipleChoiceFilters.find(f => f.fieldName===Object.keys(result)[0])
                let currentData = filter.currentData as MultipleChoiceFilterData;
                currentData.optionsAndCounts = result[filter.fieldName];
            })
            this.dataService.pushNewFilterData(this.searchFilters);
        });
    }

    async getMultipleChoiceFilterOptions(filter: SearchFilter): Promise<AggregateData> {
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
        let aggregator = {name: filter.fieldName, size: defaultData.options.length}
        return this.searchService.aggregateSearch(this.corpus, this.queryModel, [aggregator]).then(results => {
            return results.aggregations;
        }, error => {
            console.trace(error, aggregator);
            return {};
        })
    }

    /**
     * Event triggered from search-filter.component
     * @param filterData 
     */
    public updateFilterData(filter: SearchFilter) {
        let index = this.searchFilters.findIndex(f => f.fieldName === filter.fieldName);
        this.searchFilters[index] = filter;
        this.filtersChanged();
    }

    public toggleActiveFilters() {
        this.searchFilters.forEach(filter => filter.useAsFilter=false);
        this.dataService.pushNewFilterData(this.searchFilters);
        this.filtersChanged();
    }

    public resetAllFilters() {
        this.searchFilters.forEach(filter => filter.currentData = filter.defaultData);
        this.toggleActiveFilters();
    }

    public filtersChanged() {
        this.activeFilters = this.searchFilters.filter(filter => filter.useAsFilter);
        this.filtersChangedEmitter.emit(this.activeFilters);
    }

}
