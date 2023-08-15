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
    update = new Subject<void>();
    active: BehaviorSubject<boolean>;
    data: BehaviorSubject<FilterData>;
    defaultData: FilterData;

    abstract description: string;
    abstract filterType: string;
    abstract routeParamName: string;

    constructor(parameters: InitialParameters) {
        this.defaultData = this.makeDefaultData(parameters);
        this.data = new BehaviorSubject<FilterData>(this.defaultData);
        this.active = new BehaviorSubject<boolean>(false);
    }

    get currentData(): FilterData {
        return this.data?.value;
    }

    get isDefault$(): Observable<boolean> {
        return this.data.asObservable().pipe(
            map(data => _.isEqual(data, this.defaultData))
        );
    }

    set(data: FilterData) {
        if (!_.isEqual(data, this.currentData)) {
            this.data.next(data);

            const active = this.active.value;
            const toDefault = _.isEqual(data, this.defaultData);
            const deactivate = active && toDefault;
            const activate = !active && !toDefault;

            if (deactivate || activate) {
                this.toggle();
            } else if (active) {
                this.update.next();
            }
        }
    }

    reset() {
        this.set(this.defaultData);
    }

    activate() {
        if (!this.active.value) {
            this.toggle();
        }
    }

    deactivate() {
        if (this.active.value) {
            this.toggle();
        }
    }

    toggle() {
        this.active.next(!this.active.value);
        this.update.next();
    }

    /**
     * set value based on route parameters
     */
    setFromParams(params: ParamMap): void {
        const value = params.get(this.routeParamName);
        if (value) {
            this.set(this.dataFromString(value));
        } else {
            this.reset();
        }
    }

    /**
     * represent the filter state in a route parameter map
     */
    toRouteParam(): { [param: string]: any } {
        const value = this.active.value ? this.dataToString(this.currentData) : undefined;
        return {
            [this.routeParamName]: value || null
        };
    }

    abstract makeDefaultData(parameters: InitialParameters): FilterData;
    abstract dataFromString(value: string): FilterData;
    abstract dataToString(data: FilterData): string;
}
