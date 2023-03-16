import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CorpusField, QueryModel } from '../models';

const defaultValueType = 'alpha';
@Component({
    selector: 'ia-search-sorting',
    templateUrl: './search-sorting.component.html',
    styleUrls: ['./search-sorting.component.scss'],
    host: { class: 'field has-addons' }
})
export class SearchSortingComponent implements OnChanges, OnDestroy {
    @Input() queryModel: QueryModel;

    public ascending = true;
    public sortField: CorpusField;

    public valueType: 'alpha' | 'numeric' = defaultValueType;
    public sortableFields: CorpusField[];
    public showFields = false;

    constructor() {}

    public get sortType(): SortType {
        return `${this.valueType}${this.ascending ? 'Asc' : 'Desc'}` as SortType;
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel) {
            this.setSortableFields();
            this.queryModel.update.subscribe(this.setStateFromQueryModel.bind(this));
        }
    }

    ngOnDestroy(): void {
        this.queryModel.setSort('default', 'desc');
    }

    setSortableFields() {
        this.sortableFields = this.queryModel.corpus.fields.filter(field => field.sortable);
        this.setStateFromQueryModel();
    }

    setStateFromQueryModel() {
        if (this.queryModel.actualSortBy === 'relevance') {
            this.sortField = undefined;
        } else {
            this.sortField = (this.queryModel.actualSortBy as CorpusField);
        }
        this.ascending = this.queryModel.sortDirection === 'asc';
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
        const sortBy = this.sortField || 'relevance';
        const direction = this.ascending ? 'asc': 'desc';
        this.queryModel.setSort(sortBy,  direction);
    }
}

type SortType = 'alphaAsc' | 'alphaDesc' | 'numericAsc' | 'numericDesc';
