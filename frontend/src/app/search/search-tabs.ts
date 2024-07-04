import { Params } from '@angular/router';
import { StoreSync } from '../store/store-sync';
import { Store } from '../store/types';
import * as _ from 'lodash';

export type SearchTab = 'search-results'|'visualizations'|'download';

interface SearchTabState {
    tab: SearchTab
};

export class SearchTabs extends StoreSync<SearchTabState> {
    protected keysInStore: ['tab', 'visualize'];

    constructor(store: Store) {
        super(store);
        this.connectToStore();
    }

    protected storeToState(params: Params): SearchTabState {
        if (_.get(params, 'tab')) {
            return { tab: params.tab }
        }
        else if (_.get(params, 'visualize')) {
            return { tab: 'visualizations' };
        } else {
            return { tab: 'search-results' }
        };
    }

    protected stateToStore(state: SearchTabState): Params {
        if (state.tab == 'search-results') {
            return { tab: null }
        } else {
            return state;
        }
    }
}
