import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';

import { PotentialFilter, SearchFilter } from '../models/index';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    template: ''
})
export abstract class BaseFilterComponent<SearchFilterClass extends SearchFilter> implements OnChanges {
    @Input()
    public filter: PotentialFilter;

    @Input()
    public grayedOut: boolean;

    /**
     * The data of the applied filter transformed to use as input for the value editors.
     */
    public data: any; // holds the user data

    constructor() {
    }

    ngOnChanges(changes): void {
        if (changes.filter) {
            this.filter.filter.data.subscribe(this.provideFilterData.bind(this));
        }
    }

    provideFilterData() {
        if (this.filter) {
            this.data = this.getDisplayData(this.filter.filter as SearchFilterClass);
        }
    }

    /**
     * Trigger a change event.
     */
    update() {
        const data = this.getFilterData();
        this.filter.filter.data.next(data);
        if (this.data.selected && this.data.selected.length === 0) {
            this.filter.deactivate();
        } else {
            this.filter.activate(); // update called through user input
        }
    }


    abstract getDisplayData(filter: SearchFilterClass);

    /**
     * Create a new version of the filter data from the user input.
     */
    abstract getFilterData(): typeof this.filter.filter.currentData;

}
