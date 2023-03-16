/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Input } from '@angular/core';

import * as _ from 'lodash';

import { PotentialFilter, Corpus, SearchFilter, QueryModel} from '../models/index';

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

    public showFilters: boolean;
    public grayOutFilters: boolean;

    private _corpus: Corpus;
    private _queryModel: QueryModel;

    constructor() {
    }

    get activeFilters(): SearchFilter[] {
        return this.queryModel.filters;
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
                pFilter.filter.currentData === pFilter.filter.defaultData);
            filtersWithSettings.forEach(filter => filter.toggle());
        }
    }

    public resetAllFilters() {
        this.activeFilters.forEach(filter => {
            filter.reset();
        });
    }

}
