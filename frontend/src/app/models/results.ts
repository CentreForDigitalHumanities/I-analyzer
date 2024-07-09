import { BehaviorSubject, Observable, combineLatest, merge, of, timer } from 'rxjs';
import { QueryModel } from './query';
import { catchError, map, mergeMap, shareReplay, takeUntil, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { StoreSync } from '../store/store-sync';
import { Store } from '../store/types';

/**
 * Abstract class for any kind of results based on a query model
 *
 * Child classes can configure additional parameters, and the method
 * for fetching results. Results will be loaded when the query model
 * or the parameters update
 */
export abstract class Results<Parameters extends object, Result> extends StoreSync<Parameters> {
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
        protected keysInStore: string[],
    ) {
        super(store);
    }

    /**
     * defines the observable result, error en loading states.
     *
     * this only creates an observable for the result; the result
     * won't be fetched until it is observed.
     */
    getResults(): void {
        this.error$ = new BehaviorSubject(undefined);

        this.query.update.pipe(
            takeUntil(this.complete$),
            map(this.assignOnQueryUpdate.bind(this)),
        ).subscribe((params: Partial<Parameters>) =>
            this.setParams(params)
        );

        const queryUpdate$ = merge(timer(0), this.query.update);

        this.result$ = combineLatest([queryUpdate$, this.state$]).pipe(
            takeUntil(this.complete$),
            map(_.last), // map to the value of this.state$
            tap(() => this.error$.next(undefined)), // clear errors
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


