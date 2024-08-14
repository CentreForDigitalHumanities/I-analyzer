import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
    APICorpusDefinition,
    CorpusDefinition,
} from '../models/corpus-definition';
import { MenuItem } from 'primeng/api';
import * as _ from 'lodash';

@Injectable()
export class CorpusDefinitionService {
    corpus$ = new BehaviorSubject<CorpusDefinition | undefined>(undefined);

    steps$ = new BehaviorSubject<MenuItem[]>([
        { label: 'Corpus information' },
        { label: 'Sample data', disabled: true },
        { label: 'Define fields', disabled: true },
    ]);
    activeStep$ = new BehaviorSubject<number>(0);

    public toggleStep(stepIndex: number) {
        const newValue = this.steps$.value;
        newValue[stepIndex].disabled = !newValue[stepIndex].disabled;
        this.steps$.next(_.cloneDeep(newValue));
    }

    public activateStep(index: number) {
        this.activeStep$.next(index);
    }

    public setCorpus(corpus: CorpusDefinition) {
        this.corpus$.next(corpus);
    }

    public setDelimiter(
        delimiter: APICorpusDefinition['source_data']['options']['delimiter']
    ): void {
        let sourceDataOpts = this.corpus$.value.definition.source_data.options;
        if (
            _.isUndefined(sourceDataOpts) ||
            sourceDataOpts.delimiter !== delimiter
        ) {
            let updatedCorpus = _.clone(this.corpus$.value);
            updatedCorpus.definition.source_data.options = {
                delimiter: delimiter,
            };
            this.setCorpus(updatedCorpus);
            this.corpus$.value.save().subscribe();
        }
    }
}
