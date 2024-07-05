import { Component } from '@angular/core';
import { actionIcons, formIcons } from '../../shared/icons';
import { ApiService } from '../../services';
import { APIEditableCorpus, CorpusDefinition } from '../../models/corpus-definition';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';

@Component({
    selector: 'ia-create-definition',
    templateUrl: './create-definition.component.html',
    styleUrls: ['./create-definition.component.scss'],
})
export class CreateDefinitionComponent {
    actionIcons = actionIcons;
    formIcons = formIcons;

    corpus: CorpusDefinition;

    error: Error;

    reset$ = new Subject<void>();

    constructor(private apiService: ApiService, private router: Router) {
        this.corpus = new CorpusDefinition(apiService);
    }

    onJSONUpload(data: any) {
        this.corpus.setFromDefinition(data);
    }

    submit() {
        this.error = undefined;
        this.corpus.save().subscribe(
            (result: APIEditableCorpus) => {
                this.router.navigate([
                    '/corpus-definitions',
                    'edit',
                    result.id,
                ]);
            },
            (err: HttpErrorResponse) => {
                this.error = err;
            }
        );
    }
}
