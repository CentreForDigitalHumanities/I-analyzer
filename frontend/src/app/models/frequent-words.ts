import { Observable, of } from 'rxjs';
import { Results } from './results';
import { MostFrequentWordsResult } from './search-results';
import { Params } from '@angular/router';
import { VisualizationService } from '../services';
import { Store } from '../store/types';
import { QueryModel } from './query';
import { CorpusField } from './corpus';
import { findByName } from '@utils/utils';

interface FrequentWordsParameters {
    field: CorpusField;
};

const BATCH_SIZE = 1000;

/** collects a the most frequent words in a text field (based on a query) */
export class FrequentWordsResults extends Results<FrequentWordsParameters, MostFrequentWordsResult[]> {
    constructor(
        store: Store, query: QueryModel,
        private visualizationService: VisualizationService
    ) {
        super(store, query, ['visualizedField']);
        this.connectToStore();
        this.getResults();
    }

    fetch(): Observable<MostFrequentWordsResult[]> {
        const field = this.state$.value.field;
        if (!field) { return of(undefined); }
        return this.visualizationService.getWordcloudData(
            field.name, this.query, this.query.corpus, BATCH_SIZE
        );
    }

    protected stateToStore(state: FrequentWordsParameters): Params {
        return { visualizedField: state.field?.name || null };
    }

    protected storeToState(params: Params): FrequentWordsParameters {
        const fieldName = params['visualizedField'];
        const field = findByName(this.query.corpus.fields, fieldName);
        return { field };
    }

    protected storeOnComplete(): Params {
        return {};
    }
}

