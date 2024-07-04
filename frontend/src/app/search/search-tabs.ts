import { Params } from '@angular/router';
import { StoreSync } from '../store/store-sync';
import { Store } from '../store/types';

export type SearchTab = 'documents'|'visualizations'|'download';

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
        if (params.get('tab')) {
            return { tab: params.tab }
        }
        else if (params.get('visualize')) {
            return { tab: 'visualizations' };
        } else {
            return { tab: 'documents' }
        };
    }

    protected stateToStore(state: SearchTabState): Params {
        if (state.tab == 'documents') {
            return { tab: null }
        } else {
            return state;
        }
    }
}
