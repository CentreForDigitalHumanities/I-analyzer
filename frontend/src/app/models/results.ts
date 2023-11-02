import { BehaviorSubject, Observable, combineLatest, merge, of } from 'rxjs';
import { QueryModel } from './query';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { EsQuery } from './elasticsearch';


export abstract class Results<Parameters, Result> {
    parameters$: BehaviorSubject<Parameters>;
    result$: Observable<Result>;
    error$: BehaviorSubject<any>;
    loading$: Observable<boolean>;

    constructor(
        public query: QueryModel,
        initialParameters: Parameters,
    ) {
        this.parameters$ = new BehaviorSubject(initialParameters);
        this.error$ = new BehaviorSubject(undefined);
        this.result$ = combineLatest([query.esQuery$, this.parameters$]).pipe(
            mergeMap(this.fetch.bind(this)),
            catchError(err => {
                this.error$.next(err);
                return of(undefined);
            }),
        );
        this.loading$ = this.makeLoadingObservable();
    }

    setParameters(parameters: Parameters) {
        this.clearError();
        this.parameters$.next(parameters);
    }

    private makeLoadingObservable(): Observable<boolean> {
        const onQueryUpdate$ = this.query.update.pipe(map(() => true));
        const onParameterChange$ = this.parameters$.pipe(map(() => true));
        const onResult$ = this.result$.pipe(map(() => false));
        const onError$ = this.error$.pipe(map(() => false));
        return merge(onQueryUpdate$, onParameterChange$, onResult$, onError$);
    }

    private clearError() {
        if (this.error$.value) {
            this.error$.next(undefined);
        }
    }

    abstract fetch(data: [EsQuery, Parameters]): Observable<Result>;

}


