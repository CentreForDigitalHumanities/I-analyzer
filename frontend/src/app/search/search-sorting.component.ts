import {
    Component,
    HostBinding,
    Input,
} from '@angular/core';
import { CorpusField, SortState } from '../models';
import { sortIcons } from '../shared/icons';
import { PageResults } from '../models/page-results';

const defaultValueType = 'alpha';
@Component({
    selector: 'ia-search-sorting',
    templateUrl: './search-sorting.component.html',
    styleUrls: ['./search-sorting.component.scss'],
})
export class SearchSortingComponent {
    @HostBinding('class') classes = 'field has-addons';
    @Input() pageResults: PageResults;

    public valueType: 'alpha' | 'numeric' = defaultValueType;
    public showFields = false;

    sortIcons = sortIcons;

    constructor() {}

    get sortState(): SortState {
        return this.pageResults.parameters$.value.sort;
    }

    get sortField(): CorpusField {
        const sortBy = this.sortState[0];
        return sortBy as CorpusField;
    }

    get ascending(): boolean {
        const sortDirection = this.sortState[1];
        return sortDirection === 'asc';
    }

    public get sortType(): SortType {
        return `${this.valueType}${
            this.ascending ? 'Asc' : 'Desc'
        }` as SortType;
    }

    get sortableFields(): CorpusField[] {
        return this.pageResults?.query.corpus.fields.filter((field) =>
            field.sortable
        );
    }

    public toggleSortType() {
        const direction = this.ascending ? 'desc' : 'asc';
        this.pageResults.setSortDirection(direction);
    }

    public toggleShowFields() {
        this.showFields = !this.showFields;
    }

    public changeField(field: CorpusField | undefined) {
        if (field === undefined) {
            this.valueType = defaultValueType;
        } else {
            this.valueType =
                ['integer', 'date', 'boolean'].indexOf(field.displayType) >= 0
                    ? 'numeric'
                    : 'alpha';
        }
        this.pageResults.setSortBy(field || undefined);
    }
}

type SortType = 'alphaAsc' | 'alphaDesc' | 'numericAsc' | 'numericDesc';
