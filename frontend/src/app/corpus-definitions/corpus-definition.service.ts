import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CorpusDefinition } from '../models/corpus-definition';
import { MenuItem } from 'primeng/api';
import { cloneDeep } from 'lodash';

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
        this.steps$.next(cloneDeep(newValue));
    }

    public activateStep(index: number) {
        this.activeStep$.next(index);
    }

    public setCorpus(corpus: CorpusDefinition) {
        // console.log(corpus);
        this.corpus$.next(corpus);
    }
}
