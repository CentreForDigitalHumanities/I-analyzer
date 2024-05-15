import { Component } from '@angular/core';
import { actionIcons } from '../../shared/icons';
import { ApiService } from '../../services';
import { Observable } from 'rxjs';
import { APICorpusDefinition } from '../../models/corpus-definition';

@Component({
    selector: 'ia-definitions-overview',
    templateUrl: './definitions-overview.component.html',
    styleUrls: ['./definitions-overview.component.scss']
})
export class DefinitionsOverviewComponent {
    actionIcons = actionIcons;

    definitions$: Observable<APICorpusDefinition[]>;

    constructor(private apiService: ApiService) {
        this.definitions$ = this.apiService.corpusDefinitions();
    }
}
