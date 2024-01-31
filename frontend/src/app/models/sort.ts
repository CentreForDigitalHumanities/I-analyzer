import { ParamMap, Params } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { makeSortSpecification } from '../utils/es-query';
import { sortSettingsToParams } from '../utils/params';
import { Corpus, CorpusField } from './corpus';
import * as _ from 'lodash';
import { findByName } from '../utils/utils';

export type SortBy = CorpusField | undefined;
export type SortDirection = 'asc'|'desc';

export type SortState = [SortBy, SortDirection];

export const sortStateFromParams = (corpus: Corpus, params?: Params): SortState => {
    if (params && 'sort' in params) {
        const [sortParam, ascParam] = params['sort'].split(',');

        let sortBy: SortBy;

        if ( sortParam === 'relevance' ) {
            sortBy = undefined;
        } else {
            sortBy = findByName(corpus.fields, sortParam);
        }

        const sortDirection: SortDirection = ascParam;

        return [sortBy, sortDirection];
    } else {
        return [undefined, 'desc'];
    }
};

// export class SortConfiguration {
//     sortBy = new BehaviorSubject<SortBy>(undefined);
//     sortDirection = new BehaviorSubject<SortDirection>('desc');

//     configuration$: Observable<SortState> = combineLatest([this.sortBy, this.sortDirection]);

//     private defaultSortBy: SortBy;
//     private defaultSortDirection: SortDirection = 'desc';

//     constructor(private corpus: Corpus, params?: ParamMap) {
//         this.defaultSortBy = this.corpus.fields.find(field => field.primarySort);
//         this.sortBy.next(this.defaultSortBy);
//         if (params) {
//             this.setFromParams(params);
//         }
//     }

//     get state(): SortState {
//         return [this.sortBy.value, this.sortDirection.value];
//     }

//     /**
//      * Whether the current state is the default sorting state
//      */
//     get isDefault(): boolean {
//         return _.isEqual(this.sortBy.value, this.defaultSortBy) && this.sortDirection.value === this.defaultSortDirection;
//     }

//     setSortBy(value: SortBy) {
//         this.sortBy.next(value);

//         // sorting by relevance is always descending
//         if (!value) {
//             this.sortDirection.next('desc');
//         }
//     }

//     setSortDirection(value: SortDirection) {
//         this.sortDirection.next(value);
//     }

//     reset() {
//         this.sortBy.next(this.defaultSortBy);
//         this.sortDirection.next(this.defaultSortDirection);
//     }

//     toRouteParam(): {sort: string|null} {
//         if (this.isDefault) {
//             return {sort: null};
//         }
//         return sortSettingsToParams(this.sortBy.value, this.sortDirection.value);
//     }

//     /** convert this configuration to the 'sort' part of an elasticsearch query */
//     toEsQuerySort(): { sort?: any } {
//         return makeSortSpecification(this.sortBy.value, this.sortDirection.value);
//     }

//     private setFromParams(params: ParamMap) {
//         if (params.has('sort')) {
//             const [sortParam, ascParam] = params.get('sort').split(',');
//             if ( sortParam === 'relevance' ) {
//                 this.sortBy.next(undefined);
//             } else {
//                 const field = findByName(this.corpus.fields, sortParam);
//                 this.sortBy.next(field);
//             }
//             this.setSortDirection(ascParam as 'asc'|'desc');
//         } else {
//             this.reset();
//         }
//     }
// }
