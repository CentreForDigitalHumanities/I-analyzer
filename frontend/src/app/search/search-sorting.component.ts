import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CorpusField, SortEvent } from '../models';

const defaultValueType = 'alpha';
@Component({
    selector: 'ia-search-sorting',
    templateUrl: './search-sorting.component.html',
    styleUrls: ['./search-sorting.component.scss'],
    host: { 'class': 'field has-addons' }
})
export class SearchSortingComponent implements OnInit {
    @Input()
    public ascending = true;

    @Input()
    public set fields(fields: CorpusField[]) {
        this.sortableFields = fields.filter(field => field.sortable);
    }

    @Input()
    public sortField: CorpusField | undefined;

    @Output()
    public onChange = new EventEmitter<SortEvent>();

    public valueType: 'alpha' | 'numeric' = defaultValueType;
    public sortableFields: CorpusField[];
    public showFields = false;

    ngOnInit() {
        this.sortField = this.sortableFields[0];
        this.valueType = ['integer', 'date', 'boolean'].indexOf(this.sortField.displayType) >= 0 ? 'numeric' : 'alpha';
    }

    public get sortType(): SortType {
        return `${this.valueType}${this.ascending ? 'Asc' : 'Desc'}` as SortType;
    }

    public toggleSortType() {
        this.ascending = !this.ascending;
        this.emitChange();
    }

    public toggleShowFields() {
        this.showFields = !this.showFields;
    }

    private emitChange() {
        this.onChange.next({ ascending: !!this.ascending, field: this.sortField });
    }
}

type SortType = 'alphaAsc' | 'alphaDesc' | 'numericAsc' | 'numericDesc';
