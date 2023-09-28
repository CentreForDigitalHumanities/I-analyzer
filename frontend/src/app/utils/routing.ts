import { Params } from '@angular/router';
import * as _ from 'lodash';
import { Observable, Observer } from 'rxjs';
import { distinct, filter, map, takeUntil, withLatestFrom } from 'rxjs/operators';

const isDistinct = ([a, b]) => !_.isEqual(a, b);

export class QueryParamManager<State> {
    constructor(
        private stateUpdate$: Observable<State>,
        private paramUpdate$: Observable<Params>,
        private paramsObserver$: Observer<Params>,
        private paramsFromState: (stateUpdate: State) => Params,
        private updateStateFromParams: (params: Params) => void,
        private complete$: Observable<void>,
        private relevantKeys: string[],
    ) {
        this.subscribeRouteToState();
        this.subscribeStateToRoute();
    }

    /** subscribe to state update and send updates to the route */
    private subscribeRouteToState() {
        // observable of parameters pushed by state updates
        const paramsFromState$ = this.stateUpdate$.pipe(
            takeUntil(this.complete$),
            map(this.paramsFromState),
        );

        const mergeCurrentIntoPushing = ([current, pushing]) =>
            [current, _.extend(current, pushing)];

        const paramPushes$ = paramsFromState$.pipe(
            // merge the data pushed by the state  update with the latest route data
            withLatestFrom(this.paramUpdate$),
            map(mergeCurrentIntoPushing),

            // filter cases where the updated data is distinct from the current data
            filter(isDistinct),

            // select the updated data
            map(_.last)
        );

        paramPushes$.subscribe(params => this.paramsObserver$.next(params));
    }

    /** subscribe to route updates and send updates to the state */
    private subscribeStateToRoute() {
        const stateIsOutdated = ([params, state]) =>
            isDistinct([params, this.paramsFromState(state)]);

        const statePushes$ = this.paramUpdate$.pipe(
            takeUntil(this.complete$),

            // filter relevant keys
            map(params => _.pick(params, this.relevantKeys)),

            // ignore updates where relevant keys have not changed
            distinct(),

            // compare with current state and ignore irrelevant updates
            withLatestFrom(this.stateUpdate$),
            filter(stateIsOutdated),

            // take the parameters
            map(_.first)
        );

        statePushes$.subscribe(params => this.updateStateFromParams(params));
    }
};
