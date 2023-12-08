import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CorpusField, QueryModel, SortConfiguration } from '../models';
import { faSortAlphaAsc, faSortAlphaDesc, faSortNumericAsc, faSortNumericDesc } from '@fortawesome/free-solid-svg-icons';

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

    icons = {
        alphaDesc: faSortAlphaDesc,
        alphaAsc: faSortAlphaAsc,
        numericDesc: faSortNumericDesc,
        numericAsc: faSortNumericAsc,
    };

    constructor() {}

    get sortConfiguration(): SortConfiguration {
        return this.queryModel.sort;
    }

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
        this.sortConfiguration.reset();
    }

    setSortableFields() {
        this.sortableFields = this.queryModel.corpus.fields.filter(field => field.sortable);
        this.setStateFromQueryModel();
    }

    setStateFromQueryModel() {
        this.sortField = this.sortConfiguration.sortBy.value;
        this.ascending = this.sortConfiguration.sortDirection.value === 'asc';
    }

    public toggleSortType() {
        const direction = this.ascending ? 'desc' : 'asc';
        this.queryModel.setSortDirection(direction);
    }

    public toggleShowFields() {
        this.showFields = !this.showFields;
    }

    public changeField(field: CorpusField | undefined) {
        if (field === undefined) {
            this.valueType = defaultValueType;
        } else {
            this.valueType = ['integer', 'date', 'boolean'].indexOf(field.displayType) >= 0 ? 'numeric' : 'alpha';
        }
        this.queryModel.setSortBy(field || undefined);
    }
}

type SortType = 'alphaAsc' | 'alphaDesc' | 'numericAsc' | 'numericDesc';
