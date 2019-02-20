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

    public view(document: FoundDocument) {
        this.viewEvent.next(document);
    }

    public searched(queryText: string, resultsCount: number) {
        // push searchResults to dataService observable, observed by visualization component
        this.dataService.pushNewSearchResults(this.results);
        this.searchedEvent.next({ queryText: queryText, resultsCount: resultsCount });
        this.isLoading = false;
    }
}
