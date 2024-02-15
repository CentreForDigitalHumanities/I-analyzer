import { Params } from '@angular/router';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreSync } from '../store/store-sync';
import { Store } from '../store/types';

export interface FilterState<FilterData> {
    active: boolean;
    data: FilterData;
}

/**
 * Describes shared attributes and properties for filters.
 */
export interface FilterInterface<FilterData = any> {
    state$: BehaviorSubject<FilterState<FilterData>>;
    update: Observable<void>;
    displayName: string;
    description: string;
    filterType: string;
    currentData: FilterData;
    isDefault$: Observable<boolean>;
    keyInStore: string;
    set: (data: FilterData) => void;
    reset: () => void;
    activate: () => void;
    deactivate: () => void;
    toggle: () => void;
    storeToState: (params: Params) => FilterState<FilterData>;
    stateToStore: (state: FilterState<FilterData>) => Record<string, any>;
    dataToString: (data: FilterData) => string;
}


/**
 * Abstract filter class
 *
 * Implements much of the logic to handle activity state.
 *
 * Filters are a StoreSync model, but have some unique internal logic because their
 * internal state is not isomorphic to the stored state. In the UI, we distinguish
 * between the default state (inactive, default data), and an inactive filter with
 * non-default data. This allows for quick toggling.
 *
 * However, these states are equivalent for querying, in that their distinction does
 * not affect the truth conditions of the query and therefore never affects the
 * search results, the distinction is not reflected in the store.
 */
export abstract class BaseFilter<InitialParameters, FilterData>
    extends StoreSync<FilterState<FilterData>>
    implements FilterInterface<FilterData> {
    /**
     * an observable that signals meaningful state updates on the filter
     *
     * meaningful updates are ones that affect the truth condition of the filter;
     * this includes setting the filter active/inactive, or changes to the data
     * while the filter is active.
     */
    update = new Observable<void>();

    /**
     * the default state of `data`, which should be interpreted as "no selection".
     *
     * if the filter data is set to this vaule, the filter will be set to "inactive".
     */
    defaultData: FilterData;

    protected keysInStore: string[];

    /**
     * the last value that the filter data was set to
     *
     * this is used to "remember" the data of inactive filters, which are not
     * distinguished in the store
     */
    private latestDataPush$: BehaviorSubject<FilterData>;

    /** user-friendly name */
    abstract displayName: string;

    /** explanatory text for the user */
    abstract description: string;

    /**
     * the type of filter; this should identify the class of filter that is being
     * implemented. It can be used to assing UI components to filter objects.
     */
    abstract filterType: string;

    constructor(store: Store, public keyInStore: string, parameters: InitialParameters) {
        super(store);
        this.keysInStore = [keyInStore];
        this.defaultData = this.makeDefaultData(parameters);
        this.latestDataPush$ = new BehaviorSubject<FilterData>(this.defaultData);
        this.connectToStore();
    }

    get currentData(): FilterData {
        return this.state$.value.data;
    }

    /**
     * whether the filter data matches the default data;
     *
     * the active state may be toggled without resetting the data; this observable
     * indicates whether the filter is resettable.
     */
    get isDefault$(): Observable<boolean> {
        return this.state$.pipe(
            map(state => this.isDefault(state.data))
        );
    }

    /**
     * set the data of the filter.
     *
     * Setting the filter to non-default data will activate it if it was not active
     * already. Setting the filter to default data will deactivate it.
     */
    set(data: FilterData) {
        this.latestDataPush$.next(data);
        if (!_.isEqual(data, this.currentData)) {
            if (this.isDefault(data)) {
                this.setParams({
                    active: false,
                    data
                });
            } else {
                this.setParams({
                    active: true,
                    data,
                });
            }
        }
    }

    /** reset the filter state
     *
     * effects:
     * - sets the data to the default state
     * - if the filter is active, it will be deactivated
     */
    reset() {
        if (this.state$.value.active) {
            this.set(this.defaultData);
        } else {
            this.latestDataPush$.next(this.defaultData);
            // you normally should not set the state directly, but in this case,
            // all inactive filters are represented identically in the store.
            // so this won't break the relationship between store and state.
            this.state$.next({
                active: false,
                data: this.defaultData,
            });
        }
    }

    /**
     * activate the filter.
     *
     * This only has an effect if the filter's state has non-default data.
     */
    activate() {
        if (!this.state$.value.active) {
            // ignore attempts to activate with default data
            if (!this.isDefault(this.state$.value.data)) {
                this.setParams({active: true});
            }
        }
    }

    /** deactivate the filter; unlike `reset`, this does not reset the data. */
    deactivate() {
        if (this.state$.value.active) {
            this.setParams({active: false});
        }
    }

    /** activate/deactivate the filter */
    toggle() {
        if (this.state$.value.active) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    /** set value based on route parameters */
    storeToState(params: Params): FilterState<FilterData> {
        const value = params[this.keyInStore];
        if (value) {
            return {
                active: true,
                data: this.dataFromString(value)
            };
        } else {
            return {
                active: false,
                data: this.latestDataPush$.value,
            };
        }
    }

    /** represent the filter state in a route parameter map */
    stateToStore(state: FilterState<FilterData>): Params {
        const value = state.active ? this.dataToString(state.data) : undefined;
        return {
            [this.keyInStore]: value || null
        };
    }

    private isDefault(data: FilterData): boolean {
        return _.isEqual(data, this.defaultData);
    }

    /** construct the default data object based on constructor parameters */
    abstract makeDefaultData(parameters: InitialParameters): FilterData;

    /** convert filter data to a string */
    abstract dataToString(data: FilterData): string;

    /** restore filter data from a string */
    abstract dataFromString(value: string): FilterData;
}
