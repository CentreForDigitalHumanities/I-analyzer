import { ParamMap } from '@angular/router';
import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Describes shared attributes and properties for filters.
 */
export interface FilterAPI<FilterData = any> {
    update: Subject<void>;
    active: BehaviorSubject<boolean>;
    data: BehaviorSubject<FilterData>;
    description: string;
    filterType: string;
    currentData: FilterData;
    isDefault$: Observable<boolean>;
    set: (data: FilterData) => void;
    reset: () => void;
    activate: () => void;
    deactivate: () => void;
    toggle: () => void;
    setFromParams: (params: ParamMap) => void;
    toRouteParam: () => Record<string, any>;
}

/**
 * Abstract filter class
 *
 * Implements much of the logic to handle activity state.
 */
export abstract class BaseFilter<InitialParameters, FilterData> implements FilterAPI<FilterData> {
    /**
     * a subject that signals meaningful state updates on the filter
     *
     * meaningful updates are ones that affect the truth condition of the filter;
     * this includes setting the filter active/inactive, or changes to the data
     * while the filter is active.
     */
    update = new Subject<void>();

    /**
     * whether the filter is "active" - that is, its current state should impose
     * a condition on any query it is used in.
     *
     * note: use `activate`/`deactivate`/`toggle` functions rather than updating this
     * subject directly.
     */
    active: BehaviorSubject<boolean>;

    /**
     * the data that represents the filter selection. An implementation of a filter
     * class should define the format of this data, and its conversion to a predicate
     * in the query language.
     */
    data: BehaviorSubject<FilterData>;

    /**
     * the default state of `data`, which should be interpreted as "no selection".
     *
     * if the filter data is set to this vaule, the filter will be set to "inactive".
     */
    defaultData: FilterData;

    /** explanatory text for the user */
    abstract description: string;

    /**
     * the type of filter; this should identify the class of filter that is being
     * implemented. It can be used to assing UI components to filter objects.
     */
    abstract filterType: string;

    /**
     * the key of this filter in the query parameters of the route.
     *
     * e.g., setting this to `foo` means the filter will look for a
     * parameter like `foo=bar` to read its state from a parameter map.
     */
    abstract routeParamName: string;

    constructor(parameters: InitialParameters) {
        this.defaultData = this.makeDefaultData(parameters);
        this.data = new BehaviorSubject<FilterData>(this.defaultData);
        this.active = new BehaviorSubject<boolean>(false);
    }

    get currentData(): FilterData {
        return this.data?.value;
    }

    /**
     * whether the filter data matches the default data;
     *
     * the active state may be toggled without resetting the data; this observable
     * indicates whether the filter is resettable.
     */
    get isDefault$(): Observable<boolean> {
        return this.data.asObservable().pipe(
            map(data => this.isDefault(data))
        );
    }

    /**
     * set the data of the filter.
     *
     * Setting the filter to non-default data will activate it if it was not active
     * already. Setting the filter to default data will deactivate it.
     */
    set(data: FilterData) {
        if (!_.isEqual(data, this.currentData)) {
            this.data.next(data);

            const active = this.active.value;
            const toDefault = this.isDefault(data);
            const deactivate = active && toDefault;
            const activate = !active;

            if (activate) {
                this.activate();
            } else if (deactivate) {
                this.deactivate();
            } else if (active) {
                this.update.next();
            }
        }
    }

    /** reset the filter state: set the data to default an deactivate */
    reset() {
        this.set(this.defaultData);
    }

    /**
     * activate the filter.
     *
     * This only has an effect if the filter's state has non-default data.
     */
    activate() {
        if (!this.active.value) {
            // ignore attempts to activate with default data
            if (!this.isDefault(this.data.value)) {
                this.active.next(true);
                this.update.next();
            }
        }
    }

    /** deactivate the filter; unlike `reset`, this does not reset the data. */
    deactivate() {
        if (this.active.value) {
            this.active.next(false);
            this.update.next();
        }
    }

    /** activate/deactivate the filter */
    toggle() {
        if (this.active.value) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    /** set value based on route parameters */
    setFromParams(params: ParamMap): void {
        const value = params.get(this.routeParamName);
        if (value) {
            this.set(this.dataFromString(value));
        } else {
            this.reset();
        }
    }

    /** represent the filter state in a route parameter map */
    toRouteParam(): { [param: string]: any } {
        const value = this.active.value ? this.dataToString(this.currentData) : undefined;
        return {
            [this.routeParamName]: value || null
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
