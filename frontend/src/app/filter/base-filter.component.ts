/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Input } from '@angular/core';

import { PotentialFilter } from '../models/index';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    template: ''
})
export abstract class BaseFilterComponent<FilterData> {
    @Input() grayedOut: boolean;

    private _filter: PotentialFilter;

    constructor() { }

    get data(): FilterData {
        return this.filter?.filter.currentData;
    }

    @Input()
    get filter() {
        return this._filter;
    }
    set filter(filter: PotentialFilter) {
        this._filter = filter;
        this.onFilterSet(filter.filter);
    }


    /**
     * Trigger a change event.
     */
    update(data: FilterData) {
        this.filter.filter.data.next(data);
    }

    /** possible administration when the filter is set, e.g. setting data limits */
    abstract onFilterSet(filter: typeof this.filter.filter): void;

}
