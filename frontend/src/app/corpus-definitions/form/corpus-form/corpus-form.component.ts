import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CorpusDefinition } from '../../../models/corpus-definition';
import { ApiService } from '../../../services';
import { MenuItem } from 'primeng/api';
import { CorpusDefinitionService } from '../../corpus-definition.service';
import { combineLatest, map, tap } from 'rxjs';
import { cloneDeep } from 'lodash';
import * as _ from 'lodash';
import { actionIcons } from '@shared/icons';

@Component({
    selector: 'ia-corpus-form',
    templateUrl: './corpus-form.component.html',
    styleUrl: './corpus-form.component.scss',
    providers: [CorpusDefinitionService],
})
export class CorpusFormComponent {
    steps$ = this.corpusDefService.steps$.asObservable();
    activeStep$ = this.corpusDefService.activeStep$.asObservable();

    nextStep$ = combineLatest([this.steps$, this.activeStep$]).pipe(
        map(([steps, current]) => _.nth(steps, current + 1)),
    );

    corpus$ = this.corpusDefService.corpus$.asObservable();

    actionIcons = actionIcons;

    constructor(
        private apiService: ApiService,
        private route: ActivatedRoute,
        private corpusDefService: CorpusDefinitionService
    ) {
        const id = parseInt(this.route.snapshot.params['corpusID'], 10);
        const fetchedCorpus = new CorpusDefinition(this.apiService, id);
        this.corpusDefService.setCorpus(fetchedCorpus);
    }

    onActiveIndexChange(event: number) {
        this.corpusDefService.activateStep(event);
    }

    toNext() {
        this.corpusDefService.activateStep(this.corpusDefService.activeStep$.value + 1);
    }
}
