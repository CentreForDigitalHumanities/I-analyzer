import { SimpleStore } from '../store/simple-store';
import { SearchTabs } from './search-tabs';

describe('SearchTabs', () => {
    let store: SimpleStore;
    let tabs: SearchTabs;

    beforeEach(() => {
        store = new SimpleStore();
        tabs = new SearchTabs(store);
    })

    it('initialises on search results', () => {
        expect(tabs.state$.value.tab).toBe('search-results');
    })

    it('switches tabs', () => {
        tabs.setParams({tab: 'download'});
        expect(tabs.state$.value.tab).toBe('download');
    })
});
