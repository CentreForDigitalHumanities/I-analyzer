import { BehaviorSubject, Observable, Subject, merge, of } from 'rxjs';
import { QueryModel } from './query';
import { catchError, map, mergeMap, share, shareReplay, takeUntil, tap } from 'rxjs/operators';
import * as _ from 'lodash';

/**
 * Abstract class for any kind of results based on a query model
 *
 * Child classes can configure additional parameters, and the method
 * for fetching results. Results will be loaded when the query model
 * or the parameters update
 */
export abstract class Results<Parameters, Result> {
    /** additional parameters besides the query model */
    parameters$: BehaviorSubject<Parameters>;

    /** retrieved results */
    result$: Observable<Result>;

    /** errors thrown in the last results fetch (if any) */
    error$: BehaviorSubject<any>;

    /** whether the model is currently loading results;
     * can be used to show a loading spinner
     */
    loading$: Observable<boolean>;

    private complete$ = new Subject<void>();

    constructor(
        public query: QueryModel,
        initialParameters: Parameters,
    ) {
        this.error$ = new BehaviorSubject(undefined);
        this.parameters$ = new BehaviorSubject(initialParameters);

        this.query.update.pipe(
            takeUntil(this.complete$),
            map(this.assignOnQueryUpdate.bind(this)),
        ).subscribe((params: Partial<Parameters>) =>
            this.setParameters(params)
        );

        this.result$ = this.parameters$.pipe(
            takeUntil(this.complete$),
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

    /** Set parameters.
     *
     * The new value can be partial; it will be merged with the current parameters.
     * Updating parameters will trigger new results being fetched.
     */
    setParameters(newValues: Partial<Parameters>) {
        this.error$.next(undefined);
        const params: Parameters = _.assign(this.parameters$.value, newValues);
        this.parameters$.next(params);
    }

    /**
     * stops the results object from listening to the query model,
     * and completes observables
     */
    complete() {
        this.complete$.next();
        this.parameters$.complete();
        this.error$.complete();
        this.complete$.complete();
    }

    /** set up the loading$ observable */
    private makeLoadingObservable(): Observable<boolean> {
        const onQueryUpdate$ = this.query.update.pipe(map(() => true));
        const onParameterChange$ = this.parameters$.pipe(map(() => true));
        const onResult$ = this.result$.pipe(map(() => false));
        const onError$ = this.error$.pipe(map(() => false));
        return merge(onQueryUpdate$, onParameterChange$, onResult$, onError$);
    }

    /** fetch results */
    abstract fetch(parameters: Parameters): Observable<Result>;

}


