import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CorpusDefinition } from '../../../models/corpus-definition';
import { ApiService } from '../../../services';
import { CorpusDefinitionService } from '../../corpus-definition.service';

@Component({
    selector: 'ia-corpus-form',
    templateUrl: './corpus-form.component.html',
    styleUrl: './corpus-form.component.scss',
    providers: [CorpusDefinitionService],
    standalone: false
})
export class CorpusFormComponent {
    steps$ = this.corpusDefService.steps$.asObservable();
    activeStep$ = this.corpusDefService.activeStep$.asObservable();

    corpus$ = this.corpusDefService.corpus$.asObservable();

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
}
