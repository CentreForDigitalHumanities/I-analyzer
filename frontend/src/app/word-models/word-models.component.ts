import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faDiagramPredecessor, faDiagramProject, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import {combineLatest as combineLatest } from 'rxjs';
import { Corpus, User } from '../models';
import { CorpusService, DialogService, SearchService, UserService } from '../services';

@Component({
    selector: 'ia-word-models',
    templateUrl: './word-models.component.html',
    styleUrls: ['./word-models.component.scss']
})
export class WordModelsComponent implements OnInit {
    user: User;
    corpus: Corpus;
    wordModelsPresent: boolean;
    queryText: string;

    activeQuery: string;

    tabIndex = 0;

    searchIcon = faMagnifyingGlass;
    wordModelsIcon = faDiagramProject;

    constructor(private corpusService: CorpusService,
        private searchService: SearchService,
        private userService: UserService,
        private dialogService: DialogService,
        private activatedRoute: ActivatedRoute,
        private router: Router) { }

    async ngOnInit(): Promise<void> {
        this.user = await this.userService.getCurrentUser();
        combineLatest(
            this.corpusService.currentCorpus,
            this.activatedRoute.paramMap,
            (corpus, params) => {
                return { corpus, params };
            }).filter(({ corpus, params }) => !!corpus)
            .subscribe(({ corpus, params }) => {
                this.queryText = params.get('query');
                this.setCorpus(corpus);
            });
    }

    setCorpus(corpus: Corpus): void {
        if (!this.corpus || this.corpus.name !== corpus.name) {
            this.corpus = corpus;
            this.wordModelsPresent = this.corpus.word_models_present;
        }
    }

    submitQuery(): void {
        this.activeQuery = this.queryText;
    }

}
