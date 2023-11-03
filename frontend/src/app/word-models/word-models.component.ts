import { Component, DoCheck, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import * as _ from 'lodash';

import { Corpus, QueryFeedback, User, WordInModelResult } from '../models';
import { AuthService, CorpusService, ParamService, WordmodelsService } from '../services';
import { ParamDirective } from '../param/param-directive';

@Component({
    selector: 'ia-word-models',
    templateUrl: './word-models.component.html',
    styleUrls: ['./word-models.component.scss'],
})
export class WordModelsComponent extends ParamDirective implements DoCheck {
    @ViewChild('searchSection', { static: false })
    public searchSection: ElementRef;
    public isScrolledDown: boolean;

    user: User;
    corpus: Corpus;

    queryText: string;
    asTable = false;
    palette: string[];

    activeQuery: string;

    currentTab: 'relatedwords' | 'wordsimilarity';
    nullableParameters = ['query', 'show'];

    tabs = {
        relatedwords: {
            title: 'Related words',
            manual: 'relatedwords',
            chartID: 'chart',
        },
        wordsimilarity: {
            title: 'Compare similarity',
            manual: 'comparesimilarity',
            chartID: 'chart',
        }
    };

    childComponentLoading: boolean;
    isLoading: boolean;
    errorMessage: string;

    queryFeedback: QueryFeedback;

    constructor(
        route: ActivatedRoute,
        router: Router,
        paramService: ParamService,
        private corpusService: CorpusService,
        private authService: AuthService,
        private wordModelsService: WordmodelsService,
    ) {
        super(route, router, paramService);
    }

    ngDoCheck() {
        if (this.isLoading !== this.childComponentLoading) {
            this.isLoading = this.childComponentLoading;
        }
    }

    async initialize(): Promise<void> {
        this.user = await this.authService.getCurrentUserPromise();
        this.corpusService.currentCorpus.subscribe(this.setCorpus.bind(this));
    }

    teardown() {}

    setStateFromParams(params: Params) {
        this.queryText = params.get('query');
        if (this.queryText) {
            this.activeQuery = this.queryText;
            this.validateQuery();
            if (this.queryFeedback === undefined) {
                this.wordModelsService
                    .wordInModel(this.queryText, this.corpus.name)
                    .then(this.handleWordInModel.bind(this))
                    .catch(() => (this.queryFeedback = { status: 'error' }));
            }
            this.activeQuery = this.queryText;
            this.queryFeedback = { status: 'success' };
        }
        if (params.has('show')) {
            this.currentTab = params.get('show');
        } else {
            this.currentTab = 'relatedwords';
        }
    }

    setCorpus(corpus: Corpus): void {
        if (corpus && (!this.corpus || this.corpus.name !== corpus.name)) {
            this.corpus = corpus;
        }
    }

    submitQuery(): void {
        this.errorMessage = undefined;
        this.setParams({ query: this.queryText });
    }

    validateQuery() {
        if (!this.queryText || !this.queryText.length) {
            this.queryFeedback = { status: 'empty' };
        } else if (this.queryText.includes(' ')) {
            this.queryFeedback = { status: 'multiple words' };
        } else {
            this.queryFeedback = undefined;
        }
    }

    handleWordInModel(result: WordInModelResult) {
        if (result.exists === true) {
            this.queryFeedback = { status: 'success' };
        } else {
            this.queryFeedback = {
                status: 'not in model',
                similarTerms: result.similar_keys,
            };
        }
    }

    onIsLoading(isLoading: boolean): void {
        this.childComponentLoading = isLoading;
    }

    setErrorMessage(event: { message: string }): void {
        this.errorMessage = event.message;
    }

    get imageFileName(): string {
        if (this.currentTab && this.corpus) {
            return `${this.currentTab}_${this.corpus.name}.png`;
        }
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown =
            this.searchSection.nativeElement.getBoundingClientRect().y === 0;
    }

    get tabNames() {
        return Object.keys(this.tabs);
    }

    onTabChange(tab: 'relatedwords' | 'wordsimilarity'): void {
        // reset error message on tab switch
        this.errorMessage = undefined;
        this.setParams({ show: tab });
    }
}
