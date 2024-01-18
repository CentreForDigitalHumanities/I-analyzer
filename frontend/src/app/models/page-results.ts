import { Observable, combineLatest, from, of } from 'rxjs';
import { QueryModel } from './query';
import { map } from 'rxjs/operators';
import { SearchService } from '../services';
import { SearchResults } from './search-results';
import { Results } from './results';
import { DocumentPage } from './document-page';
import { SortState, sortStateFromParams } from './sort';
import { ParamMap } from '@angular/router';

export const RESULTS_PER_PAGE = 20;

export interface PageResultsParameters {
    sort: SortState;
    highlight?: number;
    from: number;
    size: number;
}

const resultsToPage = (results: SearchResults): DocumentPage =>
    new DocumentPage(results.documents, results.total.value, results.fields);

export class PageResults extends Results<PageResultsParameters, DocumentPage> {
    sort$: Observable<SortState>;
    highlight$: Observable<number|undefined>;
    from$: Observable<number>;
    to$: Observable<number>;

    constructor(
        private searchService: SearchService,
        query: QueryModel,
        params?: ParamMap
    ) {
        super(query, {
            sort: sortStateFromParams(query.corpus, params),
            highlight: undefined,
            from: 0,
            size: RESULTS_PER_PAGE,
        });
        this.sort$ = this.parameters$.pipe(map(p => p.sort));
        this.highlight$ = this.parameters$.pipe(map(p => p.highlight));
        this.from$ = this.parameters$.pipe(
            map(parameters => parameters.from + 1)
        );
        this.to$ = combineLatest([this.parameters$, this.result$]).pipe(
            map(this.highestDocumentIndex)
        );
    }

    /** Parameters to re-assign when the query model is updated. */
    assignOnQueryUpdate(): Partial<PageResultsParameters> {
        return {
            from: 0
        };
    }

    fetch(params: PageResultsParameters): Observable<DocumentPage> {
        return from(this.searchService.loadResults(
            this.query, params
        )).pipe(
            map(resultsToPage)
        );
    }

    private highestDocumentIndex([parameters, result]: [PageResultsParameters, DocumentPage]): number {
        const limit = parameters.from + parameters.size;
        return Math.min(limit, result.total);
    }
}
