import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import * as _ from "lodash";
import * as moment from 'moment';

import { CorpusField, SearchFilter, SearchFilterData } from '../models/index';
import { DataService } from '../services/index';
import { CommentStmt } from '@angular/compiler';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    selector: 'search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnDestroy, OnInit {
    @Input()
    public field: CorpusField;

    @Output('update')
    public updateEmitter = new EventEmitter<SearchFilter>();

    public filter: SearchFilter;

    /**
     * The data of the applied filter transformed to use as input for the value editors.
     */
    public data: any; // holds the user data

    public subscription: Subscription;

    public greyedOut: boolean = false;
    public useAsFilter: boolean = false;
    public minDate: Date;
    public maxDate: Date;
    public minYear: number;
    public maxYear: number;

    constructor(private dataService: DataService) {
        this.subscription = this.dataService.filterData$.subscribe(
            data => {
                if (this.field && data!==undefined) {               
                    this.filter = data.find(f => f.fieldName === this.field.name);
                    this.greyedOut = false;
                    this.data = this.getDisplayData(this.filter);
                    this.useAsFilter = this.filter.useAsFilter;
                }
            });
    }

    ngOnInit() {
        if (this.field) {
            this.filter = this.field.searchFilter;
            if (this.filter.defaultData.filterType === 'DateFilter') {
                this.minDate = new Date(this.filter.defaultData.min);
                this.maxDate = new Date(this.filter.defaultData.max);
                this.minYear = this.minDate.getFullYear();
                this.maxYear = this.maxDate.getFullYear();
            }
            this.data = this.getDisplayData(this.filter);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    getDisplayData(filter: SearchFilter) {
        switch (filter.currentData.filterType) {
            case 'BooleanFilter':
                return filter.currentData.checked;
            case 'RangeFilter':
                return [filter.currentData.min, filter.currentData.max];
            case 'MultipleChoiceFilter':    
                let options = [];
                if (filter.currentData.optionsAndCounts) {
                    options = filter.currentData.optionsAndCounts.map( x => {
                        return { 'label': x.key + " (" + x.doc_count + ")", 'value': x.key }
                    });
                }
                else options = filter.currentData.options.map(x => { return { 'label': x, 'value': x } });
                if (options.length === 0) {
                    this.greyedOut = true;
                }
                return { options: options, selected: filter.currentData.selected };
            case 'DateFilter':
                return {
                    min: new Date(filter.currentData.min),
                    max: new Date(filter.currentData.max),
                    minYear: this.minYear,
                    maxYear: this.maxYear
                }
        }

        console.error(['Unexpected combination of filter and filterData', filter, this.data]);
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    getFilterData(): SearchFilter {
        let filterType = this.filter.currentData.filterType;
        switch (filterType) {
            case 'BooleanFilter':
                this.filter.currentData = {
                    filterType: filterType,
                    checked: this.data
                };
                break;
            case 'RangeFilter':
                this.filter.currentData = {
                    filterType: filterType,
                    min: this.data[0], 
                    max: this.data[1] 
                };
                break;
            case 'MultipleChoiceFilter':
                this.filter.currentData = {
                    filterType: filterType,
                    options: this.data.options,
                    selected: this.data.selected
                };
                break;
            case 'DateFilter':
                this.filter.currentData = {
                    filterType: filterType,
                    min: this.formatDate(this.data.min),
                    max: this.formatDate(this.data.max)
                };
                break;
        }
        return this.filter;
    }

    /**
     * Trigger a change event.
     */
    update(toggleOrReset: string = null) {
        // check if filter was toggled or reset
        if (toggleOrReset == "toggle") {
            this.useAsFilter = !this.useAsFilter;
        }
        else if (toggleOrReset == "reset") {
            this.useAsFilter = false;
            this.filter.currentData = this.filter.defaultData;
            this.data = this.getDisplayData(this.filter);
        }
        else this.useAsFilter = true; // update called through user input
        this.filter.useAsFilter = this.useAsFilter;
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
