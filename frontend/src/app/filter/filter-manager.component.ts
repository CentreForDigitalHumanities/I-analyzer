import { Component, Input, OnInit } from '@angular/core';

import { AggregateData, Corpus, MultipleChoiceFilterData, QueryModel, searchFilterDataFromParam, SearchFilter } from '../models/index';

@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent implements OnInit {
    @Input() private corpus: Corpus;
    @Input() private queryModel: QueryModel;

    public searchFilters: SearchFilter [] = [];
    public showFilters: boolean;

    constructor() { }

    ngOnInit() {
        this.searchFilters = this.corpus.fields.filter(field => field.searchFilter).map(field => field.searchFilter);
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
        let queryModel = this.searchService.createQueryModel(this.queryText, this.getQueryFields(), filters);
        let defaultData = filter.defaultData as MultipleChoiceFilterData;
        let aggregator = {name: filter.fieldName, size: defaultData.options.length}
        return this.searchService.aggregateSearch(this.corpus, queryModel, [aggregator]).then(results => {
            return results.aggregations;
        }, error => {
            console.trace(error, aggregator);
            return {};
        })
    }

    /**
     * Set the filter data from the query parameters and return whether any filters were actually set.
     */
    setFiltersFromParams(searchFilters: SearchFilter[], params: ParamMap) {
        searchFilters.forEach( f => {
            let param = this.searchService.getParamForFieldName(f.fieldName);
            if (params.has(param)) {
                if (this.showFilters == undefined) {
                    this.showFilters = true;
                }
                let filterSettings = params.get(param).split(',');
                if (filterSettings[0] == "") filterSettings = [];
                f.currentData = searchFilterDataFromParam(f.fieldName, f.currentData.filterType, filterSettings);
                f.useAsFilter = true;
            }
            else {
                f.useAsFilter = false;
            }
        })
    }

    /**
     * Event triggered from search-filter.component
     * @param filterData 
     */
    public updateFilterData(filter: SearchFilter) {
        let index = this.searchFilters.findIndex(f => f.fieldName === filter.fieldName);
        this.searchFilters[index] = filter;
        this.search();
    }

    export function searchFilterDataToParam(filter: SearchFilter): string | string[] {
        switch (filter.currentData.filterType) {
            case "BooleanFilter":
                return `${filter.currentData}`;
            case "MultipleChoiceFilter":
                return filter.currentData.selected as string[];
            case "RangeFilter": {
                return `${filter.currentData.min}:${filter.currentData.max}`;
            }
            case "DateFilter": {
                return `${filter.currentData.min}:${filter.currentData.max}`;
            }
        }
    }
    
    export function searchFilterDataFromParam(fieldName: string, filterType: SearchFilterType, value: string[]): SearchFilterData {
        switch (filterType) {
            case "BooleanFilter":
                return { filterType, checked: value[0] === 'true' };
            case "MultipleChoiceFilter":
                return { filterType, options: [], selected: value };
            case "RangeFilter": {
                let [min, max] = value[0].split(':');
                return { filterType, min: parseFloat(min), max: parseFloat(max) };
            }
            case "DateFilter": {
                let [min, max] = value[0].split(':');
                return { filterType, min: min, max: max };
            }
        }
    }

}
