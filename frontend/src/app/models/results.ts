import { BehaviorSubject, Observable, merge, of } from 'rxjs';
import { QueryModel } from './query';
import { catchError, map, mergeMap, share, shareReplay, tap } from 'rxjs/operators';
import * as _ from 'lodash';


export abstract class Results<Parameters, Result> {
    parameters$: BehaviorSubject<Parameters>;
    result$: Observable<Result>;
    error$: BehaviorSubject<any>;
    loading$: Observable<boolean>;

    constructor(
        public query: QueryModel,
        initialParameters: Parameters,
    ) {
        this.error$ = new BehaviorSubject(undefined);
        this.parameters$ = new BehaviorSubject(initialParameters);
        this.query.update.subscribe(() =>
            this.setParameters(this.assignOnQueryUpdate())
        );
        this.result$ = this.parameters$.pipe(
            mergeMap(this.fetch.bind(this)),
            catchError(err => {
                this.error$.next(err);
                return of(undefined);
            }),
            shareReplay(1),
        );
        this.loading$ = this.makeLoadingObservable();
    }

    /** Parameters to re-assign when the query model is updated. */
    assignOnQueryUpdate(): Partial<Parameters> {
        return {};
    }

    setParameters(newValues: Partial<Parameters>) {
        this.clearError();
        const params: Parameters = _.assign(this.parameters$.value, newValues);
        this.parameters$.next(params);
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


    abstract fetch(parameters: Parameters): Observable<Result>;

}


