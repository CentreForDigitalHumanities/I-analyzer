import { Params } from '@angular/router';
import * as _ from 'lodash';

import { StoreSync } from '../store/store-sync';
import { Store } from '../store/types';

export interface NgramSettings {
    size: number;
    positions: string;
    freqCompensation: boolean;
    analysis: string;
    maxDocuments: number;
    numberOfNgrams: number;
    dateField: string;
}

export class NgramParameters extends StoreSync<NgramSettings> {

    keysInStore = ['ngramSettings'];

    constructor(store: Store) {
        super(store);
        this.connectToStore();
    }

    stateToStore(state: NgramSettings): Params {
        return { ngramSettings: [`s:${state.size}`,`p:${state.positions}`,`c:${state.freqCompensation}`,
            `a:${state.analysis}`,`m:${state.maxDocuments}`,`n:${state.numberOfNgrams}`,
            `f:${state.dateField}`].join(',') }
    }

    storeToState(params: Params): NgramSettings {
        if (_.has(params, 'ngramSettings')) {
            const stringComponents = params['ngramSettings'].split(',');
            return {
                size: parseInt(this.findSetting('s', stringComponents), 10),
                positions: this.findSetting('p', stringComponents),
                freqCompensation: this.findSetting('c', stringComponents) === 'true',
                analysis: this.findSetting('a', stringComponents),
                maxDocuments: parseInt(this.findSetting('m', stringComponents), 10),
                numberOfNgrams: parseInt(this.findSetting('n', stringComponents), 10),
                dateField: this.findSetting('f', stringComponents)
            }
        }
        return {
            size: 2,
            positions: 'any',
            freqCompensation: false,
            analysis: 'none',
            maxDocuments: 50,
            numberOfNgrams: 10,
            dateField: 'date'
        } as NgramSettings;
    }

    findSetting(abbreviation: string, stringComponents: string[]): string | undefined{
        const setting = stringComponents.find(s => s[0] === abbreviation);
        return setting.split(':')[1];
    }

    getCurrentRouterState(): string {
        return _.get(this.store.currentParams(), 'ngramSettings');
    }
}
