/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Input } from '@angular/core';

import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FilterInterface, QueryModel } from '../models/index';

@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent {
    @Input() queryModel: QueryModel;

    constructor() {
    }

    get activeFilters(): FilterInterface[] {
        return this.queryModel?.activeFilters;
    }

    get filters(): FilterInterface[] {
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
            this.filters.forEach(filter => filter.activate());
        }
    }

    public resetAllFilters() {
        this.filters.forEach(filter => {
            filter.reset();
        });
    }

}
