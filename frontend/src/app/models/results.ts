import { BehaviorSubject, Observable, combineLatest, from } from 'rxjs';
import { QueryModel } from './query';
import { map, mergeMap } from 'rxjs/operators';
import { EsQuery } from './elasticsearch';
import { SortBy, SortDirection } from './sort';
import { FoundDocument } from './found-document';
import { SearchService } from '../services';
import { SearchResults } from './search-results';
import { CorpusField } from './corpus';
import * as _ from 'lodash';

abstract class Results<Parameters, Result> {
    parameters$: BehaviorSubject<Parameters>;
    result$: Observable<Result>;

    constructor(
        public query: QueryModel,
        initialParameters: Parameters,
    ) {
        this.parameters$ = new BehaviorSubject(initialParameters);
        this.result$ = combineLatest([query.esQuery$, this.parameters$]).pipe(
            mergeMap(this.fetch.bind(this))
        );
    }

    setParameters(parameters: Parameters) {
        this.parameters$.next(parameters);
    }

    abstract fetch(data: [EsQuery, Parameters]): Observable<Result>;
}

interface DocumentResultsParameters {
    sortBy: SortBy;
    sortDirection: SortDirection;
    highlight?: number;
}

export interface PageResultsParameters {
    from: number;
    size: number;
};

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
    constructor(
        private searchService: SearchService,
        query: QueryModel,
        params: PageResultsParameters,
    ) {
        super(query, params);
    }

    fetch([esQuery, params]: [EsQuery, PageResultsParameters]): Observable<DocumentPage> {
        return from(this.searchService.loadResults(
            this.query, params.from, params.size
        )).pipe(
            map(parseResults)
        );
    }
}
