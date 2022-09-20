import { Component, DoCheck, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {BehaviorSubject, combineLatest as combineLatest } from 'rxjs';
import { Corpus, QueryFeedback, User, WordInModelResult } from '../models';
import { CorpusService, SearchService, UserService } from '../services';
import { WordmodelsService } from '../services/wordmodels.service';

@Component({
    selector: 'ia-word-models',
    templateUrl: './word-models.component.html',
    styleUrls: ['./word-models.component.scss']
})
export class WordModelsComponent implements DoCheck, OnInit {
    @ViewChild('searchSection', {static: false})
    public searchSection: ElementRef;
    public isScrolledDown: boolean;

    user: User;
    corpus: Corpus;
    modelDocumentation: any;

    queryText: string;
    asTable = false;
    palette: string[];

    activeQuery: string;

    tabIndex = new BehaviorSubject<'relatedwords'|'wordsimilarity'>('relatedwords');

    tabs = {
        relatedwords: {
            title: 'Related words',
            manual: 'relatedwords',
            chartID: 'chart'
        },
        wordsimilarity: {
            title: 'Compare similarity',
            manual: undefined,
            chartID: undefined,
        }
    };

    childComponentLoading: boolean;
    isLoading: boolean;
    errorMessage: string;

    queryFeedback: QueryFeedback;

    constructor(private corpusService: CorpusService,
                private searchService: SearchService,
                private userService: UserService,
                private wordModelsService: WordmodelsService,
                private router: Router) {
        this.tabIndex.subscribe(tab => {
            // reset error message when switching tabs
            this.errorMessage = undefined;
        });
    }


    ngDoCheck() {
        if (this.isLoading !== this.childComponentLoading ) {
            this.isLoading = this.childComponentLoading;
        }
    }


    async ngOnInit(): Promise<void> {
        this.user = await this.userService.getCurrentUser();
        this.corpusService.currentCorpus.subscribe(this.setCorpus.bind(this));
    }

    setCorpus(corpus: Corpus): void {
        if (corpus && (!this.corpus || this.corpus.name !== corpus.name)) {
            this.corpus = corpus;
            if (!this.corpus.word_models_present) {
                this.router.navigate(['search', this.corpus.name]);
            }
            this.getDocumentation();
        }
    }

    getDocumentation() {
        this.wordModelsService.getWordModelsDocumentation({corpus_name: this.corpus.name}).then(result => {
            this.modelDocumentation = result.documentation;
        });
    }

    submitQuery(): void {
        this.errorMessage = undefined;
        this.activeQuery = this.queryText;
        this.validateQuery();
        if (this.queryFeedback === undefined) {
            this.searchService.wordInModel(this.queryText, this.corpus.name)
                .then(this.handleWordInModel.bind(this))
                .catch(() => this.queryFeedback = { status: 'error' });
        }
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
                similarTerms: result.similar_keys
            };
        }
    }

    onIsLoading(isLoading: boolean): void {
        this.childComponentLoading = isLoading;
    }

    setErrorMessage(event: {message: string}): void {
        this.errorMessage = event.message;
    }

    get currentTab(): any {
        return this.tabs[this.tabIndex.value];
    }

    get imageFileName(): string {
        if (this.tabIndex && this.corpus) {
            return `${this.currentTab.name}_${this.corpus.name}.png`;
        }
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown = this.searchSection.nativeElement.getBoundingClientRect().y === 0;
    }

    get tabNames() {
        return Object.keys(this.tabs);
    }

}
