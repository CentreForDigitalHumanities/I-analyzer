import { Component, Input } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { CorpusField } from '../models';
import { ParamDirective } from '../param/param-directive';
import { sortSettingsFromParams, sortSettingsToParams } from '../utils/params';
import { sortDirectionFromBoolean } from '../utils/sort';

const defaultValueType = 'alpha';
@Component({
    selector: 'ia-search-sorting',
    templateUrl: './search-sorting.component.html',
    styleUrls: ['./search-sorting.component.scss'],
    host: { class: 'field has-addons' }
})
export class SearchSortingComponent extends ParamDirective {
    @Input()
    public set fields(fields: CorpusField[]) {
        this.sortableFields = fields.filter(field => field.sortable);
    }

    private sortData: {
        field: CorpusField
        ascending: boolean
    }
    public ascending = true;
    public primarySort: CorpusField;
    public sortField: CorpusField;

    public valueType: 'alpha' | 'numeric' = defaultValueType;
    public sortableFields: CorpusField[];
    public showFields = false;

    public get sortType(): SortType {
        return `${this.valueType}${this.ascending ? 'Asc' : 'Desc'}` as SortType;
    }

    initialize() {
        this.primarySort = this.sortableFields.find(field => field.primarySort);
        this.sortField = this.primarySort;
    }

    teardown() {
        this.setParams({ sort: null });
    }

    setStateFromParams(params: ParamMap) {
        this.sortData = sortSettingsFromParams(params, this.sortableFields);
        this.sortField = this.sortData.field;
        this.ascending = this.sortData.ascending;
    }

    public toggleSortType() {
        this.ascending = !this.ascending;
        this.updateSort();
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
        this.updateSort();
    }

    private updateSort() {
        const setting = sortSettingsToParams(this.sortField, sortDirectionFromBoolean(this.ascending));
        this.setParams(setting);
    }
}

type SortType = 'alphaAsc' | 'alphaDesc' | 'numericAsc' | 'numericDesc';
