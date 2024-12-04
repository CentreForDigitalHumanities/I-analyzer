import { SimpleStore } from '../store/simple-store';
import { RouterStoreService } from '../store/router-store.service';
import { NgramParameters, NgramSettings } from './ngram';

describe('NgramParameters', ()=> {
    let store: RouterStoreService = new SimpleStore() as any;
    let ngramParameters: NgramParameters;
    const testState = {
        size: 3,
        positions: 'first',
        freqCompensation: true,
        analysis: 'clean',
        maxDocuments: 100,
        numberOfNgrams: 20,
        dateField: 'releaseDate'
    } as NgramSettings;
    const testParams = {ngramSettings: 's:2,p:first,c:true,a:clean,m:100,n:20,f:releaseDate'}

    beforeEach(() => {
        ngramParameters = new NgramParameters(store);
    });

    it('should correctly convert internal state to a route parameter', () => {
        const params = ngramParameters.stateToStore(testState);
        expect(params).toEqual(testParams);
    });

    it('should correctly convert a route parameter to an internal state', () => {
        const state = ngramParameters.storeToState(testParams);
        expect(state).toEqual(testState);
    });

});
