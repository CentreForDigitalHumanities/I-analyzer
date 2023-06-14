import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

import { QueryModel, SearchFilter } from '../models/index';
import { Subscription } from 'rxjs';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    template: ''
})
export abstract class BaseFilterComponent<FilterData> implements OnChanges {
    @Input() filter: SearchFilter;
    @Input() queryModel: QueryModel;

    private queryModelSubscription: Subscription;

    constructor() { }

    get data(): FilterData {
        return this.filter?.currentData;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.filtter) {
            this.onFilterSet(this.filter);
        }

        if (changes.queryModel) {
            if (this.queryModelSubscription) {
                this.queryModelSubscription.unsubscribe();
            }
            this.queryModelSubscription = this.queryModel.update.subscribe(() =>
                this.onQueryModelUpdate()
            );
            this.onQueryModelUpdate(); // run update immediately
        }
    }

    /**
     * Trigger a change event.
     */
    update(data: FilterData) {
        this.filter.set(data);
    }

    /** possible administration when the filter is set, e.g. setting data limits */
    onFilterSet(filter): void {};

    onQueryModelUpdate() {}
}
