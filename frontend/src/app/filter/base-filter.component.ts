import { EventEmitter, Input, Output } from '@angular/core';
import { Subscription } from 'rxjs';

import { CorpusField, SearchFilter, SearchFilterData } from '../models/index';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
export abstract class BaseFilterComponent <T extends SearchFilterData> {
    @Input()
    public field: CorpusField;

    @Output('update')
    public updateEmitter = new EventEmitter<SearchFilter<T>>();

    public filter: SearchFilter<T>;

    /**
     * The data of the applied filter transformed to use as input for the value editors.
     */
    public data: any; // holds the user data

    public subscription: Subscription;

    public grayedOut: boolean = false;
    public useAsFilter: boolean = false;

    constructor() {
    }

    provideFilterData() {
        if (this.field) {
            this.filter = this.field.searchFilter as SearchFilter<T>;
            this.data = this.getDisplayData(this.filter);
            this.useAsFilter = this.filter.useAsFilter;
        }
    }

    abstract getDisplayData(filter: SearchFilter<T>);

    /**
     * Create a new version of the filter data from the user input.
     */
    abstract getFilterData(): SearchFilter<T>;

    /**
     * Trigger a change event.
     */
    update() {
        if (this.data.selected && this.data.selected.length==0) {
            this.useAsFilter = false;
        }
        else  {
            this.useAsFilter = true; // update called through user input
        }
        this.filter.useAsFilter = this.useAsFilter;
        this.updateEmitter.emit(this.getFilterData());
    }
}
