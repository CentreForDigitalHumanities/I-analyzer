import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { APIEditableCorpus } from '@models/corpus-definition';
import { ApiService } from '@services';
import { actionIcons, documentIcons } from '@shared/icons';
import { pageTitle } from '@utils/app';
import { showLoading } from '@utils/utils';
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs';

@Component({
    selector: 'ia-definitions-overview',
    templateUrl: './definitions-overview.component.html',
    styleUrls: ['./definitions-overview.component.scss'],
    standalone: false
})
export class DefinitionsOverviewComponent {
    actionIcons = actionIcons;
    documentIcons = documentIcons;

    corpora$: Observable<APIEditableCorpus[]>;

    corpusToDelete$ = new BehaviorSubject<APIEditableCorpus|null>(null);
    deleteLoading$ = new BehaviorSubject<boolean>(false);

    constructor(
        private apiService: ApiService,
        private title: Title
    ) {
        this.corpora$ = this.apiService.corpusDefinitions();
        this.title.setTitle(pageTitle('Corpus definitions'));
    }

    openDelete(corpus: APIEditableCorpus) {
        this.corpusToDelete$.next(corpus);
    }

    confirmDelete(corpus: APIEditableCorpus) {
        const request$ = this.apiService.deleteCorpus(corpus.id);
        showLoading(
            this.deleteLoading$,
            lastValueFrom(request$)
        ).then(() => {
            this.corpora$ = this.apiService.corpusDefinitions();
            this.corpusToDelete$.next(null);
        });
    }

    cancelDelete() {
        this.corpusToDelete$.next(null);
    }
}
