/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Input } from '@angular/core';
import * as _ from 'lodash';

import { QueryModel, SearchFilter } from '../models/index';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    template: ''
})
export abstract class BaseFilterComponent<FilterData> {
    private _filter: SearchFilter;

    constructor() { }

    get data(): FilterData {
        return this.filter?.currentData;
    }

    @Input()
    get filter() {
        return this._filter;
    }
    set filter(filter: SearchFilter) {
        this._filter = filter;
        this.onFilterSet(filter);
    }

    @Input() queryModel: QueryModel;


    /**
     * Trigger a change event.
     */
    update(data: FilterData) {
        this.filter.set(data);
    }

    /** possible administration when the filter is set, e.g. setting data limits */
    onFilterSet(filter): void {};
}
