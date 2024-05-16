import { Component } from '@angular/core';
import { actionIcons } from '../../shared/icons';
import { Observable, combineLatest } from 'rxjs';
import { APICorpusDefinition } from '../../models/corpus-definition';
import { ApiService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import { map, tap } from 'rxjs/operators';

@Component({
    selector: 'ia-edit-definition',
    templateUrl: './edit-definition.component.html',
    styleUrls: ['./edit-definition.component.scss']
})
export class EditDefinitionComponent {

    actionIcons = actionIcons;

    definition$: Observable<APICorpusDefinition>;

    constructor(
        private apiService: ApiService,
        private route: ActivatedRoute
    ) {
        const corpusID$ = this.route.params.pipe(
            map(params => parseInt(params['corpusID'], 10))
        );
        this.definition$ = combineLatest([
            this.apiService.corpusDefinitions(),
            corpusID$,
        ]).pipe(
            tap(values => console.log(values)),
            map(([definitions, id]) => definitions.find(def => def.id === id))
        );
    }

}
