import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import * as _ from "lodash";
import * as moment from 'moment';

import { CorpusField, QueryModel, MultipleChoiceFilter, SearchFilter, SearchFilterData, AggregateData } from '../models/index';
import { DataService } from '../services/index';

@Component({
    selector: 'search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnChanges, OnDestroy {
    @Input()
    public field: CorpusField;

    @Input()
    public filterCommand: boolean;

    @Output('update')
    public updateEmitter = new EventEmitter<SearchFilterData>();

    public get filter() {
        return this.field.searchFilter;
    }

    private filterData: SearchFilterData;

    /**
     * The data of the applied filter transformed to use as input for the value editors.
     */
    public data: any;
    public options: {label: string, value: string}[];

    public subscription: Subscription;

    public aggregateData: AggregateData;

    public greyedOut: boolean = false;
    public useAsFilter: boolean = false;

    constructor(private dataService: DataService) {
        this.subscription = this.dataService.filterData$.subscribe(
            data => {
                if (this.field && this.filter.name === 'MultipleChoiceFilter') {
                    this.aggregateData = data;
                    this.updateMultipleChoiceFilters();
                }
            });
    }

    ngOnChanges() {
        if (this.field) {
            this.filterData = this.defaultFilterData(this.filter);
            this.data = this.getDisplayData(this.filter);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    defaultFilterData(filter: SearchFilter): SearchFilterData {
        // unfortunately this isn't typed, so be careful here
        let fieldName = this.field.name;

        switch (filter.name) {
            case 'BooleanFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    useAsFilter: false,
                    data: false
                };
            case 'MultipleChoiceFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    useAsFilter: false,
                    data: []
                };
            case 'RangeFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    useAsFilter: false,
                    data: { gte: filter.lower, lte: filter.upper }
                };
            case 'DateFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    useAsFilter: false,
                    data: {
                        gte: this.formatDate(filter.lower),
                        lte: this.formatDate(filter.upper)
                    }
                };
        }
    }

    getDisplayData(filter: SearchFilter) {
        switch (this.filterData.filterName) {
            case 'BooleanFilter':
                return this.filterData.data;
            case 'RangeFilter':
                return [this.filterData.data['gte'], this.filterData.data['lte']];
            case 'MultipleChoiceFilter':
                let options = [];
                options = this.filterData.data.map(x => { return { 'label': x, 'value': x } });
                return { options: options, selected: this.filterData.data };

            case 'DateFilter':
                if (filter.name == this.filterData.filterName) {
                    return {
                        min: new Date(this.filterData.data.gte),
                        max: new Date(this.filterData.data.lte),
                        minYear: new Date(filter.lower).getFullYear(),
                        maxYear: new Date(filter.upper).getFullYear()
                    };
                }
                break;
        }

        console.error(['Unexpected combination of filter and filterData', filter, this.filterData]);
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    getFilterData(): SearchFilterData {
        switch (this.filter.name) {
            case 'BooleanFilter':
                return {
                    fieldName: this.field.name,
                    useAsFilter: this.useAsFilter,
                    filterName: this.filter.name,
                    data: this.data
                };
            case 'RangeFilter':
                return {
                    fieldName: this.field.name,
                    useAsFilter: this.useAsFilter,
                    filterName: this.filter.name,
                    data: { gte: this.data[0], lte: this.data[1] }
                };
            case 'MultipleChoiceFilter':
                return {
                    fieldName: this.field.name,
                    useAsFilter: this.useAsFilter,
                    filterName: this.filter.name,
                    data: this.data.selected
                };
            case 'DateFilter':
                return {
                    fieldName: this.field.name,
                    useAsFilter: this.useAsFilter,
                    filterName: this.filter.name,
                    data: {
                        gte: this.formatDate(this.data.min || this.filter.lower),
                        lte: this.formatDate(this.data.max || this.filter.upper)
                    }
                };
        }
    }

    updateMultipleChoiceFilters() {
        if (this.aggregateData != null) {
            this.greyedOut = false;
            let options = _.sortBy(
                this.aggregateData[this.filterData.fieldName], x => x.key
            ).map(
                x => {
                    return { 'label': x.key + " (" + x.doc_count + ")", 'value': x.key }
                });
            if (options.length === 0) {
                //this.greyedOutEmitter.emit(true);
                this.greyedOut = true;
            }
            else this.data.options = options;
        }         
    }

    /**
     * Trigger a change event.
     */
    update(toggleOrReset: string = null) {
        // check if filter was activated by toggle
        if (toggleOrReset == "toggle") {
            this.useAsFilter = !this.useAsFilter;
        }
        if (toggleOrReset == "reset") {
            this.useAsFilter = false;
            this.filterData = this.defaultFilterData(this.filter);
        }
        else this.useAsFilter = true;
        this.updateEmitter.emit(this.getFilterData());
    }

    toggleFilter() {
        this.update("toggle");
    }

    resetFilter() {
        this.update("reset");
    }

    /**
     * Return a string of the form 0123-04-25.
     */
    formatDate(date: Date): string {
        return moment(date).format().slice(0, 10);
    }
}
