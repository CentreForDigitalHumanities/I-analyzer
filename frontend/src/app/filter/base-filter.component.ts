import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

import { QueryModel } from '../models/index';
import { Subscription } from 'rxjs';
import { FilterAPI } from '../models/base-filter';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    template: ''
})
export abstract class BaseFilterComponent<SearchFilter extends FilterAPI<any>> implements OnChanges {
    @Input() filter: SearchFilter;
    @Input() queryModel: QueryModel;

    private queryModelSubscription: Subscription;
    private filterSubscription: Subscription;

    constructor() { }

    get data(): typeof this.filter.currentData {
        return this.filter?.currentData;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.filter) {
            if (this.filterSubscription) {
                this.filterSubscription.unsubscribe();
            }
            this.filterSubscription = this.filter.update.subscribe(() =>
                // this does not cause an update loop, searchFilter will ignore same-data updates
                this.onFilterSet(this.filter)
            );
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
    update(data: typeof this.filter.currentData) {
        this.filter.set(data);
    }

    /** possible administration when the filter is set, e.g. setting data limits */
    onFilterSet(filter): void {};

    onQueryModelUpdate() {}
}
