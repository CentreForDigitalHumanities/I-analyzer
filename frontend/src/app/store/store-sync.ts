import { Params } from '@angular/router';
import { Store } from './types';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';



export abstract class StoreSync<State extends object> {
    /**
     * The stored state to of the model.
     *
     * This is implemented as a BehaviorSubject so you can read state$.value, but
     * you should NOT push values onto the state directly. Use setParams() instead.
     */
    state$: BehaviorSubject<State>;

    protected complete$ = new Subject<void>();
    private isComplete = false;

    /** keys of the stored parameters that this model interacts with */
    protected abstract keysInStore: string[];

    constructor(protected store: Store) { }

    /**
     * set the state of the model.
     */
    setParams(newValues: Partial<State>) {
        if (this.isComplete) {
            throw Error('attempted to set parameters on a model after completing it');
        }

        const newState: State = _.assign(_.clone(this.state$.value), newValues);

        if (!_.isEqual(this.state$.value, newState)) {
            const newParams = this.stateToStore(newState);
            this.store.paramUpdates$.next(newParams);
        }
    }

    /**
     * complete the model
     *
     * Call this when the model is no longer relevant; usually when destroying the
     * component that uses it.
     *
     * This closes subscriptions and blocks any further interaction with the store.
     * It also resets the model's parameters in the store.
     */
    complete() {
        this.isComplete = true;
        this.complete$.next();
        this.complete$.complete();
        this.state$.complete();

        this.store.paramUpdates$.next(this.storeOnComplete());
    }

    /**
     * fetch the initial state from the store and subscribe to further updates
     * from the store.
     *
     * should probably called in the constructor of the child class. (Not called in
     * the parent constructor because you may want access to the child class data)
     * */
    protected connectToStore() {
        this.state$ = new BehaviorSubject(this.storeToState(this.store.currentParams()));
        this.subscribeToStore();
    }

    /** called on initialisation: subscribes to the store until the model is completed */
    protected subscribeToStore() {
        this.store.params$.pipe(
            takeUntil(this.complete$),
            distinctUntilChanged(_.isEqual, params => this.filterStoreSyncParams(params)),
            map(params => this.storeToState(params)),
        ).subscribe(params =>
            this.state$.next(params)
        );
    }

    /** filters the stored parameters and only includes the ones relevant for this model */
    protected filterStoreSyncParams(params: Params): Params {
        return _.pick(params, this.keysInStore);
    }

    /** parameters sent to the store on completion
     *
     * (i.e. reset this model's keys to null)
     */
    protected storeOnComplete(): Params {
        const toNull = Object.assign({}, ...this.keysInStore.map(f => ({[f]: null})));
        return toNull;
    }

    /** convert the internal state to the format used in the store */
    protected abstract stateToStore(state: State): Params;

    /** convert stored parameters to the internal format of the model */
    protected abstract storeToState(params: Params): State;

};
