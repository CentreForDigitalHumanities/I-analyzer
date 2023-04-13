import { Component, Input, OnChanges } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import * as _ from 'lodash';
import { Subject } from 'rxjs';

import { AggregateData, Corpus, MultipleChoiceFilterData, SearchFilter,
    SearchFilterData, CorpusField } from '../models/index';
import { SearchService } from '../services';
import { ParamDirective } from '../param/param-directive';
import { ParamService } from '../services/param.service';
import { findByName } from '../utils/utils';
import { filtersFromParams, paramForFieldName, searchFilterDataToParam } from '../utils/params';


@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent extends ParamDirective implements OnChanges {
    @Input() public corpus: Corpus;

    inputChanged = new Subject<void>();

    public corpusFields: CorpusField[];
    public searchFilters: SearchFilter<SearchFilterData> [] = [];
    public activeFilters: SearchFilter<SearchFilterData> [] = [];

    public showFilters: boolean;
    public grayOutFilters: boolean;

    public multipleChoiceData: Object = {};

    constructor(
        private paramService: ParamService,
        private searchService: SearchService,
        route: ActivatedRoute,
        router: Router) {
            super(route, router);
    }

    initialize() {
        this.corpusFields = _.cloneDeep(this.corpus.fields);
        this.searchFilters = this.corpusFields.filter(field => field.searchFilter).map(field => field.searchFilter);
    }

    ngOnChanges() {
        this.initialize();
        this.inputChanged.next();
    }

    setStateFromParams(params: ParamMap) {
        this.activeFilters = filtersFromParams(
            params, this.corpusFields
        );
        this.aggregateSearchForMultipleChoiceFilters(params);

    }

    teardown() {
        const params = {};
        this.activeFilters.forEach(filter => {
            const paramName = paramForFieldName(filter.fieldName);
            params[paramName] = null;
        });
        this.setParams(params);
    }

    /**
     * For all multiple choice filters, get the bins and counts
     * Exclude the filter itself from the aggregate search
     * Save results in multipleChoiceData, which is structured as follows:
     * fieldName1: [{key: option1, doc_count: 42}, {key: option2, doc_count: 3}],
     * fieldName2: [etc]
     */
    private aggregateSearchForMultipleChoiceFilters(params) {
        const multipleChoiceFilters = this.searchFilters.filter(f => !f.adHoc && f.currentData.filterType === 'MultipleChoiceFilter');

        const aggregateResultPromises = multipleChoiceFilters.map(filter => this.getMultipleChoiceFilterOptions(filter, params));
        Promise.all(aggregateResultPromises).then(results => {
            results.forEach( r =>
                this.multipleChoiceData[Object.keys(r)[0]] = Object.values(r)[0]
            );
            // if multipleChoiceData is empty, gray out all filters
            if (multipleChoiceFilters && multipleChoiceFilters.length != 0) {this.grayOutFilters = this.multipleChoiceData[multipleChoiceFilters[0].fieldName].length === 0;}
        });
    }

    async getMultipleChoiceFilterOptions(filter: SearchFilter<SearchFilterData>, params: ParamMap): Promise<AggregateData> {
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
        const queryModel = this.paramService.queryModelFromParams(params, this.corpusFields);
        return this.searchService.aggregateSearch(this.corpus, queryModel, [aggregator]).then(results => {
            return results.aggregations;
        }, error => {
            console.trace(error, aggregator);
            return {};
        });
    }

    toggleFilter(filter: SearchFilter<SearchFilterData>) {
        filter.useAsFilter = !filter.useAsFilter;
        this.updateFilterData(filter);
    }

    resetFilter(filter: SearchFilter<SearchFilterData>) {
        filter.useAsFilter = false;
        filter.currentData = filter.defaultData;
        filter.reset = true;
        this.updateFilterData(filter);
    }

    /**
     * Event triggered from filter components
     *
     * @param filterData
     */
    public updateFilterData(filter: SearchFilter<SearchFilterData>) {
        findByName(this.corpusFields, filter.fieldName).searchFilter = filter;
        this.filtersChanged();
    }

    public toggleActiveFilters() {
        if (this.activeFilters.length) {
            this.activeFilters.forEach(filter => filter.useAsFilter = false);
        } else {
            // if we don't have active filters, set all filters to active which don't use default data
            let filtersWithSettings = this.corpusFields.filter(
                field => field.searchFilter && field.searchFilter.currentData != field.searchFilter.defaultData
            ).map( field => field.searchFilter );
            filtersWithSettings.forEach( field => field.useAsFilter = true);
        }
        this.filtersChanged();
    }

    public resetAllFilters() {
        this.activeFilters.forEach(filter => {
            filter.currentData = filter.defaultData;
            filter.reset = true;
        });
        this.toggleActiveFilters();
    }

    public filtersChanged(): Object {
        const newFilters = this.corpusFields.filter(field => field.searchFilter?.useAsFilter).map(f => f.searchFilter);
        let params = {};
        this.activeFilters.forEach(filter => {
            // set any params for previously active filters to null
            if (!newFilters.map(f => f.fieldName).find(name => name === filter.fieldName)) {
                const paramName = paramForFieldName(filter.fieldName);
                params[paramName] = null;
                if (filter.adHoc) {
                    // also set sort null in case of an adHoc filter
                    params['sort'] = null;
                }
            }
        });
        newFilters.forEach(filter => {
            const paramName = paramForFieldName(filter.fieldName);
            const value = filter.useAsFilter? searchFilterDataToParam(filter) : null;
            params[paramName] = value;
        });
        this.setParams(params);
        return params;
    }

}
