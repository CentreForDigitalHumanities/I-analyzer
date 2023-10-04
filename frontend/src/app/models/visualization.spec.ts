import { NgramParameters } from './visualization';

describe('NgramParameters', ()=> {
    let ngramParameters: NgramParameters;

    beforeEach(() => {
        ngramParameters = new NgramParameters(
            2,
            'any',
            false,
            'none',
            50,
            10,
            'date'
        );
    });

    it('should convert itself to a param string', () => {
        const paramString = ngramParameters.toRouteParam();
        expect(paramString).toEqual(
            's:2,p:any,c:false,a:none,m:50,n:10,f:date'
        );
    });

    it('should set itself from a param string', () => {
        ngramParameters.fromRouteParam(
            's:3,p:first,c:true,a:none,m:50,n:20,f:date'
        );
        expect(ngramParameters.size).toEqual(3);
        expect(ngramParameters.positions).toEqual('first');
        expect(ngramParameters.freqCompensation).toEqual(true);
        expect(ngramParameters.analysis).toEqual('none');
        expect(ngramParameters.maxDocuments).toEqual(50);
        expect(ngramParameters.numberOfNgrams).toEqual(20);
        expect(ngramParameters.dateField).toEqual('date');
    });
});
