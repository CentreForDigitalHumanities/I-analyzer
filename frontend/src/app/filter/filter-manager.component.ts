/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Input } from '@angular/core';

import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Corpus, SearchFilter, QueryModel } from '../models/index';

@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent {
    @Input() corpus: Corpus;

    @Input() queryModel: QueryModel;

    constructor() {
    }

    get activeFilters(): SearchFilter[] {
        return this.queryModel?.activeFilters;
    }

    get filters(): SearchFilter[] {
        return this.queryModel?.filters;
    }

    get anyActiveFilters$(): Observable<boolean> {
        if (this.filters) {
            const statuses = this.filters.map(filter => filter.active);
            return combineLatest(statuses).pipe(
                map(values => _.some(values)),
            );
        }
    }

    get anyNonDefaultFilters$(): Observable<boolean> {
        if (this.filters) {
            const statuses = this.filters.map(filter => filter.isDefault$);
            return combineLatest(statuses).pipe(
                map(values => !_.every(values)),
            );
        }
    }

    public toggleActiveFilters() {
        if (this.activeFilters.length) {
            this.filters.forEach(filter => filter.deactivate());
        } else {
            // if we don't have active filters, set all filters to active which don't use default data
            const filtersWithSettings = this.filters.filter(filter =>
                !_.isEqual(filter.currentData, filter.defaultData));
            filtersWithSettings.forEach(filter => filter.toggle());
        }
    }

    public resetAllFilters() {
        this.filters.forEach(filter => {
            filter.reset();
        });
    }

}
