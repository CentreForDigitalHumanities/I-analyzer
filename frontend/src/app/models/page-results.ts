import { Observable, combineLatest, from, of } from 'rxjs';
import { QueryModel } from './query';
import { map } from 'rxjs/operators';
import { SearchService } from '../services';
import { SearchResults } from './search-results';
import { Results } from './results';
import { DocumentPage } from './document-page';

export const RESULTS_PER_PAGE = 20;

export interface PageResultsParameters {
    from: number;
    size: number;
}

const parseResults = (results: SearchResults): DocumentPage =>
    new DocumentPage(results.documents, results.total.value, results.fields);

export class PageResults extends Results<PageResultsParameters, DocumentPage> {
    from$: Observable<number>;
    to$: Observable<number>;

    constructor(
        private searchService: SearchService,
        query: QueryModel,
    ) {
        super(query, {
            from: 0,
            size: RESULTS_PER_PAGE,
        });
        this.from$ = this.parameters$.pipe(
            map(parameters => parameters.from + 1)
        );
        this.to$ = combineLatest([this.parameters$, this.result$]).pipe(
            map(this.highestDocumentIndex)
        );
    }

    assignOnQueryUpdate(): Partial<PageResultsParameters> {
        return {
            from: 0
        };
    }

    fetch(params: PageResultsParameters): Observable<DocumentPage> {
        return from(this.searchService.loadResults(
            this.query, params.from, params.size
        )).pipe(
            map(parseResults)
        );
    }

    private highestDocumentIndex([parameters, result]: [PageResultsParameters, DocumentPage]): number {
        const limit = parameters.from + parameters.size;
        return Math.min(limit, result.total);
    }
}
