import { Params } from '@angular/router';
import * as _ from 'lodash';
import { Observable, Observer } from 'rxjs';
import { distinct, filter, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';

const areDistinct = ([a, b]) => !_.isEqual(a, b);

const mergeCurrentIntoPushing = ([current, pushing]) =>
    [current, _.extend(current, pushing)];

export class QueryParamManager<State> {
    constructor(
        /** signals when the model's state updates */
        private stateUpdate$: Observable<State>,
        /** signals when the route parameters have changed */
        private paramUpdate$: Observable<Params>,
        /** observer to which you can push changes to the route parameters */
        private paramsObserver$: Observer<Params>,
        /** function converting the model state to parameters */
        private paramsFromState: (stateUpdate: State) => Params,
        /** function updating the model state from parameters */
        private updateStateFromParams: (params: Params) => void,
        /** signals when the model is destroyed */
        private complete$: Observable<void>,
        /** keys in the route parameters that the model syncs with */
        private relevantKeys: string[],
    ) {
        this.subscribeRouteToState();
        this.subscribeStateToRoute();
        this.resetOnComplete();
    }

    /** subscribe to state update and send updates to the route */
    private subscribeRouteToState() {
        const paramPushes$ = this.stateUpdate$.pipe(
            takeUntil(this.complete$),

            // convert state to parameters
            map(this.paramsFromState),

            // merge the data pushed by the state  update with the latest route data
            withLatestFrom(this.paramUpdate$),
            map(mergeCurrentIntoPushing),

            // only emit if the new data is distinct from the current data
            filter(areDistinct),

            // output new new data
            map(_.last),
        );

        paramPushes$.subscribe(params => this.paramsObserver$.next(params));
    }

    /** subscribe to route updates and send updates to the state */
    private subscribeStateToRoute() {
        const stateIsOutdated = ([params, state]) =>
            areDistinct([params, this.paramsFromState(state)]);

        const statePushes$ = this.paramUpdate$.pipe(
            takeUntil(this.complete$),

            // filter relevant keys
            map(params => _.pick(params, this.relevantKeys)),

            // ignore updates where relevant keys have not changed
            distinct(),

            // compare with current state and ignore irrelevant updates
            withLatestFrom(this.stateUpdate$),
            filter(stateIsOutdated),

            // output only the state update
            map(_.first),
        );

        statePushes$.subscribe(params => this.updateStateFromParams(params));
    }

    private resetOnComplete() {
        this.complete$.pipe(
            // only need to do this once
            take(1),

            // signal null parameters
            map(() => this.nullParams()),

            // merge null parameters into latest parameters
            withLatestFrom(this.paramUpdate$),
            map(mergeCurrentIntoPushing),
        ).subscribe(params =>
            this.paramsObserver$.next(params)
        );
    }

    /**
     * object with null value for each relevant parameters
     *
     * used to reset paramets on completion
     */
    private nullParams() {
        return Object.assign({}, ...this.relevantKeys.map(f => ({ [f]: null })));
    }
};
