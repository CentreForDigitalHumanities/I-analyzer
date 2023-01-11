import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { CorpusField, SortEvent } from '../models';
import { ParamDirective } from '../param/param-directive';
import { ParamService } from '../services';

const defaultValueType = 'alpha';
@Component({
    selector: 'ia-search-sorting',
    templateUrl: './search-sorting.component.html',
    styleUrls: ['./search-sorting.component.scss'],
    host: { 'class': 'field has-addons' }
})
export class SearchSortingComponent extends ParamDirective {
    @Input()
    public set fields(fields: CorpusField[]) {
        this.sortableFields = fields.filter(field => field.sortable);
    }

    public ascending = true;
    public sortField: CorpusField | string;

    public valueType: 'alpha' | 'numeric' = defaultValueType;
    public sortableFields: CorpusField[];
    public showFields = false;

    public get sortType(): SortType {
        return `${this.valueType}${this.ascending ? 'Asc' : 'Desc'}` as SortType;
    }

    constructor(
        route: ActivatedRoute,
        router: Router,
        private paramService: ParamService
    ) {
        super(route, router);
    }

    initialize() {

    }

    teardown() {
        this.setParams({ sort: null });
    }

    setStateFromParams(params: ParamMap) {
        const sortData = this.paramService.setSortFromParams(this.sortableFields, params);
        this.sortField = sortData.field;
        this.ascending = sortData.ascending;
    }

    public toggleSortType() {
        this.ascending = !this.ascending;
        this.emitChange();
    }

    public toggleShowFields() {
        this.showFields = !this.showFields;
    }

    public changeField(field: CorpusField | undefined) {
        if (field === undefined) {
            this.valueType = defaultValueType;
            this.ascending = false;
        } else {
            this.valueType = ['integer', 'date', 'boolean'].indexOf(field.displayType) >= 0 ? 'numeric' : 'alpha';
        }
        this.sortField = field;
        this.emitChange();
    }

    private emitChange() {
        const setting = this.sortField === 'default' ? null : `${this.sortField},${this.ascending ? 'asc': 'desc'}`;
        const params =  { sort: setting };
        this.setParams(params);
    }
}

type SortType = 'alphaAsc' | 'alphaDesc' | 'numericAsc' | 'numericDesc';
