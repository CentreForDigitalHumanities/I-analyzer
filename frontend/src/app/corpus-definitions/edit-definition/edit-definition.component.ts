import { Component } from '@angular/core';
import { actionIcons } from '../../shared/icons';
import { Observable } from 'rxjs';
import { APICorpusDefinition, APIEditableCorpus } from '../../models/corpus-definition';
import { ApiService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';


@Component({
    selector: 'ia-edit-definition',
    templateUrl: './edit-definition.component.html',
    styleUrls: ['./edit-definition.component.scss']
})
export class EditDefinitionComponent {

    actionIcons = actionIcons;

    corpus$: Observable<APIEditableCorpus>;

    constructor(
        private apiService: ApiService,
        private route: ActivatedRoute
    ) {
        this.corpus$ = this.route.params.pipe(
            map(params => parseInt(params['corpusID'], 10)),
            switchMap(id => this.apiService.corpusDefinition(id))
        );
    }

    downloadJSON(definition: APICorpusDefinition) {
        const content = JSON.stringify(definition);
        const blob = new Blob([content], { type: `text/csv;charset=utf-8`, endings: 'native' });
        const filename = definition.name + '.json';
        saveAs(blob, filename);
    }

}
