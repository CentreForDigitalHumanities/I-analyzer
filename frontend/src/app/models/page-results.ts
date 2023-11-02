import { BehaviorSubject, Observable, combineLatest, from, of } from 'rxjs';
import { QueryModel } from './query';
import { map } from 'rxjs/operators';
import { FoundDocument } from './found-document';
import { SearchService } from '../services';
import { SearchResults } from './search-results';
import { CorpusField } from './corpus';
import * as _ from 'lodash';
import { Results } from './results';

const RESULTS_PER_PAGE = 20;

export interface PageResultsParameters {
    from: number;
    size: number;
}

export class DocumentPage {
    focus$ = new BehaviorSubject<FoundDocument>(undefined);

    constructor(
        public documents: FoundDocument[],
        public total: number,
        public fields?: CorpusField[]
    ) {
        this.documents.forEach((d, i) => d.position = i + 1);
    }

    focus(document: FoundDocument) {
        this.focus$.next(document);
    }

    focusNext() {
        this.focusShift(1);
    }

    focusPrevious() {
        this.focusShift(-1);
    }

    blur() {
        this.focus$.next(undefined);
    }

    private focusShift(shift: number) {
        const document = this.focus$.value;
        if (document) {
            this.focusPosition(document.position + shift);
        }
    }

    private focusPosition(position: number) {
        const index = _.clamp(position - 1, 0, this.documents.length - 1);
        this.focus(this.documents[index]);
    }
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
