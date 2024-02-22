import { Observable, from, of } from 'rxjs';
import { Results } from './results';
import { AggregateResult } from './search-results';
import { Params } from '@angular/router';
import { VisualizationService } from '../services';
import { Store } from '../store/types';
import { QueryModel } from './query';
import { CorpusField } from './corpus';
import { findByName } from '../utils/utils';

interface FrequentWordsParameters {
    field: CorpusField;
};

export class FrequentWordsResults extends Results<FrequentWordsParameters, AggregateResult[]> {
    private batchSize = 1000;

    constructor(
        store: Store,
        query: QueryModel,
        private visualizationService: VisualizationService
    ) {
        super(store, query, ['visualizedField']);
        this.connectToStore();
        this.getResults();
    }

    fetch(): Observable<AggregateResult[]> {
        const field = this.state$.value.field;
        if (!field) { return of(undefined); }
        const promise = this.visualizationService.getWordcloudData(
            field.name,
            this.query,
            this.query.corpus,
            this.batchSize
        );
        return from(promise);
    }

    protected stateToStore(state: FrequentWordsParameters): Params {
        return {};
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

