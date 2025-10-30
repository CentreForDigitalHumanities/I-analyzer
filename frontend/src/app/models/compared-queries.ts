import { Params } from '@angular/router';
import { StoreSync } from '../store/store-sync';
import * as _ from 'lodash';
import { Store } from '../store/types';
import { Observable } from 'rxjs';
import { queryFromParams, queryToParams } from '../utils/params';
import { distinctUntilChanged, distinctUntilKeyChanged, filter, map, takeUntil } from 'rxjs/operators';

interface CompareQueryState {
    primary: string|undefined;
    compare: string[];
}

export const COMPARE_TERMS_KEY = 'compareTerms';
export const DELIMITER = ',';

export class ComparedQueries extends StoreSync<CompareQueryState> {
    /** all queries, including the primary query text */
    allQueries$: Observable<string[]>;

    /** compared queries, excluding the primary query text */
    comparedQueries$: Observable<string[]>;

    protected keysInStore = ['query', COMPARE_TERMS_KEY];

    constructor(store: Store) {
        super(store);
        this.connectToStore();

        this.cleanStoredState();

        this.allQueries$ = this.state$.pipe(
            map(state => [state.primary, ...state.compare])
        );
        this.comparedQueries$ = this.state$.pipe(
            distinctUntilKeyChanged('compare', _.isEqual),
            map(state => state.compare),
        );
    }

    reset() {
        this.setParams({ compare: [] });
    }

    protected storeToState(params: Params): CompareQueryState {
        const primary = queryFromParams(params);
        const compare = this.cleanComparedQueries(
            primary,
            this.comparedTermsInParams(params)
        );
        return { primary, compare };
    }

    protected stateToStore(state: CompareQueryState): Params {
        const query = queryToParams(state.primary);
        let compareTerms: string;
        if (!_.isEmpty(state.compare)) {
            compareTerms = this.cleanComparedQueries(state.primary, state.compare).join(DELIMITER);
        } else {
            compareTerms = null;
        }
        return {...query, [COMPARE_TERMS_KEY]: compareTerms};
    }

    protected storeOnComplete(): Params {
        /** on complete, reset the compareTerms parameter, but not the query text */
        return { [COMPARE_TERMS_KEY]: null };
    }

    /** checks that the stored state does not contain duplicate terms, & pushes a
     * cleaned version if that happens
     */
    private cleanStoredState() {
        this.store.params$.pipe(
            takeUntil(this.complete$),
            filter(this.isDirty.bind(this)),
        ).subscribe(params => {
            this.store.paramUpdates$.next(this.stateToStore(this.storeToState(params)));
        });

    }

    /**
     * get a "cleaned" list of compared queries by removing overlapping ones
     */
    private cleanComparedQueries(primary: string, compared: string[]) {
        return _.uniq(_.without(compared, primary));
    }

    /**
     * Checks whether a stored state contains queries that must be cleaned (i.e.
     * duplicates)
     */
    private isDirty(params: Params): boolean {
        const stored = this.comparedTermsInParams(params);
        const cleaned = this.storeToState(params).compare;
        return !_.isEqual(stored, cleaned);
    }

    private comparedTermsInParams(params: Params): string[] {
        if (_.has(params, COMPARE_TERMS_KEY)) {
            return params[COMPARE_TERMS_KEY].split(DELIMITER);
        } else {
            return [];
        }
    }
}
