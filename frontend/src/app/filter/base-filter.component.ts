import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PotentialFilter, SearchFilter } from '../models/index';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    template: ''
})
export abstract class BaseFilterComponent<Data, SearchFilterClass extends SearchFilter> {
    private _filter: PotentialFilter;

    @Input()
    get filter() {
        return this._filter;
    }
    set filter(filter: PotentialFilter) {
        this._filter = filter;
        this.data$ = this.filter.filter.data.asObservable().pipe(
            map(this.getDisplayData.bind(this))
        );
        this.onFilterSet(filter.filter as SearchFilterClass);
    }

    @Input()
    public grayedOut: boolean;

    /**
     * The data of the applied filter transformed to use as input for the value editors.
     */
    public data$: Observable<Data>; //

    constructor() { }


    /**
     * Trigger a change event.
     */
    update(data: Data) {
        const filterData = this.getFilterData(data);
        this.filter.filter.data.next(filterData);
        if ((data as any).selected && (data as any).selected.length === 0) {
            this.filter.deactivate();
        } else {
            this.filter.activate(); // update called through user input
        }
    }

    /** possible administration when the filter is set, e.g. setting data limits */
    abstract onFilterSet(filter: SearchFilterClass): void;

    /** get the internal data representation from the filter data */
    abstract getDisplayData(filterData): Data;

    /** get the filter data formt from the internal representation */
    abstract getFilterData(data: Data);

}
