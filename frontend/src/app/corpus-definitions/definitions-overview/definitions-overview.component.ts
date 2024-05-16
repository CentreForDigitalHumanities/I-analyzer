import { Component } from '@angular/core';
import { actionIcons } from '../../shared/icons';
import { ApiService} from '../../services';
import { Observable } from 'rxjs';
import { APIEditableCorpus } from '../../models/corpus-definition';
import * as _ from 'lodash';

@Component({
    selector: 'ia-definitions-overview',
    templateUrl: './definitions-overview.component.html',
    styleUrls: ['./definitions-overview.component.scss']
})
export class DefinitionsOverviewComponent {
    actionIcons = actionIcons;

    corpora$: Observable<APIEditableCorpus[]>;

    constructor(private apiService: ApiService) {
        this.corpora$ = this.apiService.corpusDefinitions();
    }
}
