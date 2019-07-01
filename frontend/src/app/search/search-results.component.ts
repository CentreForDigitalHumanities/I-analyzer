import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, ViewChild } from '@angular/core';

import { User, Corpus, SearchParameters, SearchResults, FoundDocument, QueryModel, ResultOverview } from '../models/index';
import { DataService, SearchService } from '../services';

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
    public viewEvent = new EventEmitter<FoundDocument>();

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
    public showError: false | undefined | {
        date: string,
        href: string,
        message: string
    };

    constructor(private searchService: SearchService, private dataService: DataService) { }

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
        this.isLoading = false;
    }

    public view(document: FoundDocument) {
        this.viewEvent.next(document);
    }

    public searched(queryText: string, resultsCount: number) {
        // emit searchedEvent to search component
        this.searchedEvent.next({ queryText: queryText, resultsCount: resultsCount });
        this.isLoading = false;
    }
}
