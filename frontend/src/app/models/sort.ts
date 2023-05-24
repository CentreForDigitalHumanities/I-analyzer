import { ParamMap } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { makeSortSpecification } from '../utils/es-query';
import { sortSettingsFromParams, sortSettingsToParams } from '../utils/params';
import { Corpus, CorpusField } from './corpus';

export type SortBy = CorpusField | 'relevance' | 'default';
export type SortDirection = 'asc'|'desc';

export class SortConfiguration {
    sortBy = new BehaviorSubject<SortBy>('default');
    sortDirection = new BehaviorSubject<SortDirection>('desc');

    configuration$ = combineLatest([this.sortBy, this.sortDirection]);

    constructor(private corpus: Corpus) {}

    /** sort direction to be used in searching: replaces 'default' with the default value */
    get actualSortBy(): CorpusField|'relevance' {
        return this.sortBy.value !== 'default' ?
            this.sortBy.value : this.defaultSortBy;
    }

    private get defaultSortBy(): CorpusField | 'relevance' {
        return this.corpus.fields.find(field => field.primarySort) || 'relevance';

    }

    setSortBy(value: SortBy) {
        this.sortBy.next(value);
        if (value === 'default' || 'relevance') {
            this.sortDirection.next('desc');
        }
    }

    setSortDirection(value: SortDirection) {
        this.sortDirection.next(value);
    }

    reset() {
        this.sortBy.next('default');
        this.sortDirection.next('desc');
    }

    setFromParams(params: ParamMap) {
        const [sortBy, direction] = sortSettingsFromParams(params, this.corpus.fields);
        this.sortBy.next(sortBy);
        this.sortDirection.next(direction);
    }

    toRouteParam(): {sort: string|null} {
        return sortSettingsToParams(this.sortBy.value, this.sortDirection.value);
    }

    /** convert this configuration to the 'sort' part of an elasticsearch query */
    toEsQuerySort(): { sort?: any } {
        return makeSortSpecification(this.actualSortBy, this.sortDirection.value);
    }
}
