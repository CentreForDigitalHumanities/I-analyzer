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

    private subscribeRouteToState() {
        const paramsFromState$ = this.stateUpdate$.pipe(
            takeUntil(this.complete$),
            map(this.paramsFromState),
        );

        const mergeCurrentIntoPushing = ([current, pushing]) =>
            [current, _.extend(current, pushing)];

        const paramPushes$ = paramsFromState$.pipe(
            withLatestFrom(this.paramUpdate$),
            map(mergeCurrentIntoPushing),
            filter(isDistinct),
            map(_.last)
        );

        paramPushes$.subscribe(params => this.paramsObserver$.next(params));
    }

    private subscribeStateToRoute() {
        const stateIsOutdated = ([params, state]) =>
            isDistinct([params, this.paramsFromState(state)]);

        const statePushes$ = this.paramUpdate$.pipe(
            map(params => _.pick(params, this.relevantKeys)),
            distinct(),
            takeUntil(this.complete$),
            withLatestFrom(this.stateUpdate$),
            filter(stateIsOutdated),
        );

        statePushes$.subscribe(params => this.updateStateFromParams(params));
    }
};
