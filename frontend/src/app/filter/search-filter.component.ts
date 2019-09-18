import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';

import { CorpusField, SearchFilter } from '../models/index';
import { DataService } from '../services/index';

/**
 * Filter component receives the corpus fields containing search filters as input
 * Filter data from parameters and after search are pushed via a DataService observable
 */
@Component({
    selector: 'search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnDestroy {
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

    constructor(private dataService: DataService) {
        this.subscription = this.dataService.filterData$.subscribe(
            data => {
                if (this.field && data !== undefined) {
                    this.filter = data.find(f => f.fieldName === this.field.name);
                    this.greyedOut = false;
                    this.data = this.getDisplayData(this.filter);
                    this.useAsFilter = this.filter.useAsFilter;
                }
            });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    provideFilterData() {
        if (this.field) {
            this.filter = this.field.searchFilter;
            this.data = this.getDisplayData(this.filter);
        }
        console.log(this.filter, this.data);
    }

    protected getDisplayData(filter: SearchFilter) {
    }

    /**
     * Create a new version of the filter data from the user input.
     */
    protected getFilterData(): SearchFilter {
        return {
            fieldName: 'isWaldo',
            description: 'description',
            useAsFilter: true,
            defaultData: {
                filterType: 'BooleanFilter',
                checked: true
            },
            currentData: {
                filterType: 'BooleanFilter',
                checked: true
            }
        }
    }

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
