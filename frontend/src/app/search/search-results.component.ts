import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { User, Corpus, SearchResults, FoundDocument, QueryModel, ResultOverview } from '../models/index';
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
    @Input()
    public queryModel: QueryModel;

    @Input()
    public user: User;

    @Input()
    public corpus: Corpus;

    @Output('view')
    public viewEvent = new EventEmitter<FoundDocument>();

    @Output('searched')
    public searchedEvent = new EventEmitter<ResultOverview>();

    public isLoading = false;

    public results: SearchResults;
    public totalResults: number;
    public totalPages: number;
    public resultsPerPage: number = 20;
    public currentPages: number[];
    public currentPage: number;

    public isMediumPage: boolean;

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
            this.search();
            this.currentPages = [1, 2, 3];
            this.isMediumPage = false;
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
            this.totalResults = this.results.total <= 10000? this.results.total : 10000;
            this.totalPages = Math.floor(this.totalResults / this.resultsPerPage);
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

    public async loadMore() {
        this.isLoading = true;
        this.results = await this.searchService.loadMore(this.corpus, this.results);
        this.searched(this.queryModel.queryText, this.results.total);
    }

    public async loadResults(page: number) {
        if (this.currentPage == page) {
            return false;
        }
        this.currentPage = page;
        let from = (this.currentPage - 1) * this.resultsPerPage;
        this.searchService.loadResults(this.corpus, this.queryModel, from, this.resultsPerPage);
        if (page == 1) {
            this.currentPages = [1, 2, 3];
            this.isMediumPage = false;
        }
        else if (page == this.totalPages) {
            this.currentPages = [this.totalPages-2, this.totalPages-1, this.totalPages];
            this.isMediumPage = false;
        }
        else {
            this.isMediumPage = true;
            this.currentPages = [page-1, page, page+1];
        }
    }

    public view(document: FoundDocument) {
        this.viewEvent.next(document);
    }

    public searched(queryText: string, resultsCount: number) {
        // push searchResults to dataService observable, observed by visualization component
        this.searchedEvent.next({ queryText: queryText, resultsCount: resultsCount });
        this.isLoading = false;
    }
}
