import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { User, Corpus, SearchResults, FoundDocument, QueryModel } from '../models/index';
import { DataService, SearchService } from '../services';
import { IRestMethodResultStrict } from 'rest-core';

@Component({
    selector: 'ia-search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, OnChanges {
    // @Input()
    // public results: SearchResults;

    /**
     * The search query to use for highlighting the results
     */
    @Input()
    public queryModel: QueryModel;

    @Input()
    public user: User;

    @Input()
    public corpus: Corpus;

    @Output('download')
    public downloadEvent = new EventEmitter();

    @Output('view')
    public viewEvent = new EventEmitter<FoundDocument>();

    @Output('searched')
    public searchedEvent = new EventEmitter<Object>();

    public isLoadingMore = false;

    public results: SearchResults;

    public queryText: string;

    /**
     * For failed searches.
     */
    public showError: false | undefined | {
        date: string,
        href: string,
        message: string
    };

    constructor(private searchService: SearchService, private dataService: DataService) { }

    ngOnInit() {
    }

    ngOnChanges() {
        this.queryText = this.queryModel.queryText;
        this.search();
    }

    private search() {
        this.searchService.search(
            this.queryModel,
            this.corpus
        ).then(results => {
            this.results = results;
            this.searched(this.queryModel.queryText, this.results.total);
            // push searchResults to data service observable, observed by visualization component
            this.dataService.pushNewSearchResults(this.results);
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
        this.isLoadingMore = true;
        this.results = await this.searchService.loadMore(this.corpus, this.results);
        this.dataService.pushNewSearchResults(this.results);
        this.isLoadingMore = false;
    }

    public download() {
        this.downloadEvent.next();
    }

    public view(document: FoundDocument) {
        this.viewEvent.next(document);
    }

    public searched(queryText: string, howManyResults: number) {
        this.searchedEvent.next({queryText: queryText, howManyResults: howManyResults});
    }
}
