import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, ViewChild } from '@angular/core';

import { User, Corpus, SearchParameters, SearchResults, FoundDocument, QueryModel, ResultOverview } from '../models/index';
import { SearchService } from '../services';
import { ShowError } from '../error/error.component';

@Component({
    selector: 'ia-search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnChanges {
    /**
     * The search queryModel to use
     */
    @ViewChild('resultsNavigation')
    public resultsNavigation: ElementRef;

    @Input()
    public queryModel: QueryModel;

    @Input()
    public user: User;

    @Input()
    public corpus: Corpus;

    @Input()
    public parentElement: HTMLElement;

    @Output('view')
    public viewEvent = new EventEmitter<{document: FoundDocument, tabIndex?: number}>();

    @Output('searched')
    public searchedEvent = new EventEmitter<ResultOverview>();

    public isLoading = false;
    public isScrolledDown: boolean;

    public results: SearchResults;

    public resultsPerPage: number = 20;
    public totalResults: number;
    private maximumDisplayed: number;

    public fromIndex: number = 0;

    public queryText: string;

    public imgSrc: Uint8Array;

    /**
     * For failed searches.
     */
    public showError: false | undefined | ShowError;

    /**
     * Whether a document has been selected to be shown.
     */
    public showDocument: boolean = false;
    /**
     * The document to view separately.
     */
    public viewDocument: FoundDocument;
    public documentTabIndex: number;

    constructor(private searchService: SearchService) { }

    ngOnChanges() {
        if (this.queryModel !== null) {
            this.queryText = this.queryModel.queryText;
            this.fromIndex = 0;
            this.maximumDisplayed = this.user.downloadLimit | 10000;
            this.search();
        }
    }

    @HostListener("window:scroll", [])
    onWindowScroll() {
        // mark that the search results were scrolled down beyond 68 pixels from top (position underneath sticky search bar)
        // this introduces a box shadow
        if (this.resultsNavigation != undefined) {
            this.isScrolledDown = this.resultsNavigation.nativeElement.getBoundingClientRect().y == 68;
        }
    }

    private search() {
        this.isLoading = true;
        this.searchService.search(
            this.queryModel,
            this.corpus
        ).then(results => {
            this.results = results;
            this.results.documents.map( (d, i) => d.position = i + 1 );
            this.searched(this.queryModel.queryText, this.results.total);
            this.totalResults = this.results.total <= this.maximumDisplayed? this.results.total : this.maximumDisplayed;
        }, error => {
            this.showError = {
                date: (new Date()).toISOString(),
                href: location.href,
                message: error.message || 'An unknown error occurred'
            };
            console.trace(error);
            // if an error occurred, return query text and 0 results
            this.searched(this.queryModel.queryText, 0);
        });
    }

    public async loadResults(searchParameters: SearchParameters) {
        this.isLoading = true;
        this.fromIndex = searchParameters.from;
        this.resultsPerPage = searchParameters.size;
        this.results = await this.searchService.loadResults(this.corpus, this.queryModel, searchParameters.from, searchParameters.size);
        this.results.documents.map( (d,i) => d.position = i + searchParameters.from + 1 );
        this.isLoading = false;
    }

    public searched(queryText: string, resultsCount: number) {
        // emit searchedEvent to search component
        this.searchedEvent.next({ queryText: queryText, resultsCount: resultsCount });
        this.isLoading = false;
    }

    public goToScan(document: FoundDocument, event:any) {
        this.onViewDocument(document);
        this.documentTabIndex = 1;
        event.stopPropagation();
    }

    public onViewDocument(document: FoundDocument) {
        this.showDocument = true;
        this.viewDocument = document;
        this.documentTabIndex = 0;
    }
}