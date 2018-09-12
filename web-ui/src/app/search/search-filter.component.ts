import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CorpusField, SearchFilter, SearchFilterData } from '../models/index';

import * as _ from "lodash";

@Component({
    selector: 'search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnChanges, OnInit {
    @Input()
    public field: CorpusField;

    @Input()
    public enabled: boolean;

    @Input()
    public filterData: SearchFilterData;

    @Input()
    public aggregations: any;

    @Input()
    public warnBottleneck: boolean;

    @Output('update')
    public updateEmitter = new EventEmitter<SearchFilterData>();

    public isBottleneck: boolean = false;

    public get filter() {
        return this.field.searchFilter;
    }

    /**
     * The data of the applied filter transformed to use as input for the value editors.
     */
    public data: any;

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        //this.data = this.getDisplayData(this.filter, this.filterData, this.aggregations);
        if (changes['aggregations'] && changes['aggregations'].currentValue != undefined) {
            this.data = this.getDisplayData(this.filter, this.filterData, this.aggregations);
        }
        if (changes['field']) {
            // make sure the filter data is reset if only the field was changed
            this.update(true);
        }
    }

    ngOnInit() {
        if (this.field) {
            this.data = this.getDisplayData(this.filter, this.filterData);
        }
    }

    defaultFilterData(filter: SearchFilter): SearchFilterData {
        // unfortunately this isn't typed, so be careful here
        let fieldName = this.field.name;

        switch (filter.name) {
            case 'BooleanFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    data: false
                };
            case 'MultipleChoiceFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    data: []
                };
            case 'RangeFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    data: { gte: filter.lower, lte: filter.upper }
                };
            case 'DateFilter':
                return {
                    fieldName,
                    filterName: filter.name,
                    data: {
                        gte: this.formatDate(filter.lower),
                        lte: this.formatDate(filter.upper)
                    }
                };
        }
    }

    getDisplayData(filter: SearchFilter, filterData: SearchFilterData = null, aggregations: any = null) {
        if (filterData == null) {
            filterData = this.defaultFilterData(filter);
        }
        switch (filterData.filterName) {
            case 'BooleanFilter':
                return filterData.data;
            case 'RangeFilter':
                return [filterData.data.gte, filterData.data.lte];
            case 'MultipleChoiceFilter':
                if (filter.name == filterData.filterName) {
                    let options = [];
                    if (aggregations != null) {
                        // sort options of multiple choice filter by name
                        // add counts of available results to labels
                        options = _.sortBy(
                            aggregations[filterData.fieldName].buckets, x => x.key
                        ).map(
                            x => { 
                                return { 'label': x.key + " (" + x.doc_count + ")", 'value': x.key } 
                        });
                    }
                    else {
                        options = filter.options.map(x => { return { 'label': x, 'value': x } });
                    }

                    return { options: options, selected: filterData.data };
                }
                break;
            case 'DateFilter':
                if (filter.name == filterData.filterName) {
                    return {
                        min: new Date(filterData.data.gte),
                        max: new Date(filterData.data.lte),
                        minYear: new Date(filter.lower).getFullYear(),
                        maxYear: new Date(filter.upper).getFullYear()
                    };
                }
                break;
        }

        console.error(['Unexpected combination of filter and filterData', filter, filterData]);
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    getFilterData() {
        this.isBottleneck = false;
        switch (this.filter.name) {
            case 'BooleanFilter':
                return {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: this.data
                };
            case 'RangeFilter':
                if (this.data[0] > this.data[1]) this.isBottleneck = true;
                return {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: { gte: this.data[0], lte: this.data[1] }
                };
            case 'MultipleChoiceFilter':
                if (this.data.selected.length === 0) this.isBottleneck = true;
                return {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: this.data.selected
                };
            case 'DateFilter':
                let lower = this.filter.lower.valueOf(),
                    upper = this.filter.upper.valueOf(),
                    min = this.data.min && this.data.min.valueOf() || lower,
                    max = this.data.max && this.data.max.valueOf() || upper;
                let localMin = Math.max(min, lower);
                let localMax = Math.min(max, upper);
                if (localMin > localMax) this.isBottleneck = true;
                return {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: {
                        gte: this.formatDate(this.data.min || this.filter.lower),
                        lte: this.formatDate(this.data.max || this.filter.upper)
                    }
                };
        }
    }

    /**
     * Trigger a change event.
     */
    update(reset = false) {
        this.updateEmitter.emit(reset ? this.defaultFilterData(this.filter) : this.getFilterData());
    }

    /**
     * Return a string of the form 0123-04-25.
     */
    formatDate(date: Date): string {
        return date.toISOString().slice(0, 10);
    }
}
