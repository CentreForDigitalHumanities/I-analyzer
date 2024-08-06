import { Component } from '@angular/core';
import { actionIcons, formIcons } from '../../shared/icons';
import { ApiService } from '../../services';
import { APIEditableCorpus, CorpusDefinition } from '../../models/corpus-definition';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { SlugifyPipe } from '../../shared/pipes/slugify.pipe';

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

    newCorpusTitle: string;

    constructor(
        private apiService: ApiService,
        private router: Router,
        private slugify: SlugifyPipe
    ) {
        this.corpus = new CorpusDefinition(this.apiService);
    }

    onJSONUpload(data: any) {
        this.corpus.setFromDefinition(data);
    }

    submit() {
        this.corpus.definition = {
            name: this.slugify.transform(this.newCorpusTitle),
            meta: {
                title: this.newCorpusTitle,
            },
            fields: [],
            source_data: {
                type: 'csv',
            },
        };
        this.corpus.definition.meta.title = this.newCorpusTitle;
        this.saveCorpus();
    }

    saveCorpus() {
        this.error = undefined;
        this.corpus.save().subscribe(
            (result: APIEditableCorpus) => {
                this.router.navigate([
                    '/corpus-definitions',
                    'form',
                    result.id,
                ]);
            },
            (err: HttpErrorResponse) => {
                this.error = err;
            }
        );
    }
}
