import { Component, DoCheck, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Corpus, QueryFeedback, User, WordInModelResult } from '../models';
import { CorpusService } from '../services';
import { AuthService } from '../services/auth.service';
import { WordmodelsService } from '../services/wordmodels.service';

@Component({
    selector: 'ia-word-models',
    templateUrl: './word-models.component.html',
    styleUrls: ['./word-models.component.scss'],
})
export class WordModelsComponent implements DoCheck, OnInit {
    @ViewChild('searchSection', { static: false })
    public searchSection: ElementRef;
    public isScrolledDown: boolean;

    user: User;
    corpus: Corpus;


    queryText: string;
    asTable = false;
    palette: string[];

    activeQuery: string;

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

    currentTab = 'relatedwords';

    childComponentLoading: boolean;
    isLoading: boolean;
    errorMessage: string;

    queryFeedback: QueryFeedback;

    constructor(
        private corpusService: CorpusService,
        private authService: AuthService,
        private wordModelsService: WordmodelsService,
        private router: Router
    ) {
    }

    ngDoCheck() {
        if (this.isLoading !== this.childComponentLoading) {
            this.isLoading = this.childComponentLoading;
        }
    }

    async ngOnInit(): Promise<void> {
        this.user = await this.authService.getCurrentUserPromise();
        this.corpusService.currentCorpus.subscribe(this.setCorpus.bind(this));
    }

    setCorpus(corpus: Corpus): void {
        if (corpus && (!this.corpus || this.corpus.name !== corpus.name)) {
            this.corpus = corpus;
            if (!this.corpus.word_models_present) {
                this.router.navigate(['search', this.corpus.name]);
            }
        }
    }


    submitQuery(): void {
        this.errorMessage = undefined;
        this.activeQuery = this.queryText;
        this.validateQuery();
        if (this.queryFeedback === undefined) {
            this.wordModelsService
                .wordInModel(this.queryText, this.corpus.name)
                .then(this.handleWordInModel.bind(this))
                .catch(() => (this.queryFeedback = { status: 'error' }));
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
        if (this.corpus) {
            return `${this.tabs[this.currentTab].name}_${this.corpus.name}.png`;
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

    onTabChange(tab: string): void {
        // reset error message on tab switch
        this.errorMessage = undefined;
        this.currentTab = tab;
    }
}
