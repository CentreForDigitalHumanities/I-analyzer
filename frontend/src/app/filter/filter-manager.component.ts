/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Input } from '@angular/core';

import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PotentialFilter, Corpus, SearchFilter, QueryModel } from '../models/index';

@Component({
    selector: 'ia-filter-manager',
    templateUrl: './filter-manager.component.html',
    styleUrls: ['./filter-manager.component.scss']
})
export class FilterManagerComponent {
    @Input()
    get corpus(): Corpus {
        return this._corpus;
    }
    set corpus(corpus: Corpus) {
        this._corpus = corpus;
        this.setPotentialFilters();
    }

    @Input()
    get queryModel(): QueryModel {
        return this._queryModel;
    }
    set queryModel(model: QueryModel) {
        this._queryModel = model;
        this.setPotentialFilters();
    }

    public potentialFilters: PotentialFilter[] = [];

    private _corpus: Corpus;
    private _queryModel: QueryModel;

    constructor() {
    }

    get activeFilters(): SearchFilter[] {
        return this.queryModel.filters;
    }

    get anyActiveFilters$(): Observable<boolean> {
        if (this.potentialFilters) {
            const statuses = this.potentialFilters.map(filter => filter.useAsFilter);
            return combineLatest(statuses).pipe(
                map(values => _.some(values)),
            );
        }
    }

    get anyNonDefaultFilters$(): Observable<boolean> {
        if (this.potentialFilters) {
            const statuses = this.potentialFilters.map(filter => filter.filter.isDefault$);
            return combineLatest(statuses).pipe(
                map(values => !_.every(values)),
            );
        }
    }

    setPotentialFilters() {
        if (this.corpus && this.queryModel) {
            this.potentialFilters = this.corpus.fields.map(field => new PotentialFilter(field, this.queryModel));
        }
    }

    public toggleActiveFilters() {
        if (this.activeFilters.length) {
            this.potentialFilters.forEach(filter => filter.deactivate());
        } else {
            // if we don't have active filters, set all filters to active which don't use default data
            const filtersWithSettings = this.potentialFilters.filter(pFilter =>
                !_.isEqual(pFilter.filter.currentData, pFilter.filter.defaultData));
            filtersWithSettings.forEach(filter => filter.toggle());
        }
    }

    public resetAllFilters() {
        this.potentialFilters.forEach(filter => {
            filter.reset();
        });
    }

}
