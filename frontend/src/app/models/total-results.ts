import { Observable, from, map } from 'rxjs';
import { SearchService } from '../services';
import { Store } from '../store/types';
import { PageResultsParameters } from './page-results';
import { QueryModel } from './query';
import { Results } from './results';
import { Params } from '@angular/router';

type Empty = Record<string, never>

/**
 * fetches the total number of search results.
 */
export class TotalResults extends Results<Empty, number> {
    constructor(
        store: Store,
        private searchService: SearchService,
        query: QueryModel,
    ) {
        super(store, query, []);
        this.connectToStore();
        this.getResults();
    }

    fetch(): Observable<number> {
        const params: PageResultsParameters = {
            size: 0,
            sort: [undefined, 'asc'],
            from: 0,
        }
        const results = this.searchService.loadResults(this.query, params);
        return from(results).pipe(
            map(result => result.total.value)
        );
    }

    protected stateToStore(state: Empty): Params {
        return {}
    }

    protected storeToState(params: Params): Empty {
        return {}
    }
}
