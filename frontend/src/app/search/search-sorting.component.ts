import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CorpusField, QueryModel } from '../models';

const defaultValueType = 'alpha';
@Component({
    selector: 'ia-search-sorting',
    templateUrl: './search-sorting.component.html',
    styleUrls: ['./search-sorting.component.scss'],
    host: { class: 'field has-addons' }
})
export class SearchSortingComponent implements OnChanges {
    @Input() queryModel: QueryModel;

    public ascending = true;
    public primarySort: CorpusField;
    public sortField: CorpusField;

    public valueType: 'alpha' | 'numeric' = defaultValueType;
    public sortableFields: CorpusField[];
    public showFields = false;

    private sortData: {
        field: CorpusField;
        ascending: boolean;
    };


    constructor() {}

    public get sortType(): SortType {
        return `${this.valueType}${this.ascending ? 'Asc' : 'Desc'}` as SortType;
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel) {
            this.queryModel.update.subscribe(this.setStateFromQueryModel.bind(this));
        }
    }

    setStateFromQueryModel(queryModel: QueryModel) {
        this.sortField = (queryModel.actualSortBy as CorpusField);
        this.ascending = queryModel.sortDirection === 'asc';
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
        this.queryModel.setSort(this.sortField,  this.ascending? 'asc': 'desc');
    }
}

type SortType = 'alphaAsc' | 'alphaDesc' | 'numericAsc' | 'numericDesc';
