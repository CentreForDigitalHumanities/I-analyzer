import { BehaviorSubject, Observable, merge, of } from 'rxjs';
import { QueryModel } from './query';
import { catchError, map, mergeMap, shareReplay, takeUntil, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { Stored } from '../store/stored';
import { Store } from '../store/types';

/**
 * Abstract class for any kind of results based on a query model
 *
 * Child classes can configure additional parameters, and the method
 * for fetching results. Results will be loaded when the query model
 * or the parameters update
 */
export abstract class Results<Parameters extends object, Result> extends Stored<Parameters> {
    /** additional parameters besides the query model */
    state$: BehaviorSubject<Parameters>;

    /** retrieved results */
    result$: Observable<Result>;

    /** errors thrown in the last results fetch (if any) */
    error$: BehaviorSubject<any>;

    /** whether the model is currently loading results;
     * can be used to show a loading spinner
     */
    loading$: Observable<boolean>;

    constructor(
        store: Store,
        public query: QueryModel,
    ) {
        super(store);
        this.connectToStore();
        this.error$ = new BehaviorSubject(undefined);

        this.query.update.pipe(
            takeUntil(this.complete$),
            map(this.assignOnQueryUpdate.bind(this)),
        ).subscribe((params: Partial<Parameters>) =>
            this.setParams(params)
        );

        this.result$ = this.state$.pipe(
            takeUntil(this.complete$),
            tap(() => this.error$.next(undefined)),
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

    /**
     * stops the results object from listening to the query model,
     * and completes observables
     */
    complete() {
        super.complete();
        this.error$.complete();
    }

    /** set up the loading$ observable */
    private makeLoadingObservable(): Observable<boolean> {
        const onQueryUpdate$ = this.query.update.pipe(map(() => true));
        const onParameterChange$ = this.state$.pipe(map(() => true));
        const onResult$ = this.result$.pipe(map(() => false));
        const onError$ = this.error$.pipe(map(() => false));
        return merge(onQueryUpdate$, onParameterChange$, onResult$, onError$);
    }

    /** fetch results */
    abstract fetch(parameters: Parameters): Observable<Result>;

}


