import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { User, Corpus, SearchResults, FoundDocument } from '../models/index';
import { SearchService } from '../services';

@Component({
    selector: 'search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
    @Input()
    public results: SearchResults;

    /**
     * The search query to use for highlighting the results
     */
    @Input()
    public query: string;

    @Input()
    public user: User;

    @Input()
    public corpus: Corpus;

    @Output('download')
    public downloadEvent = new EventEmitter();

    @Output('view')
    public viewEvent = new EventEmitter<FoundDocument>();

    public isLoadingMore = false;

    constructor(private searchService: SearchService) { }

    ngOnInit() {
    }

    public async loadMore() {
        this.isLoadingMore = true;
        this.results = await this.searchService.loadMore(this.results);
        this.isLoadingMore = false;
    }

    public download() {
        this.downloadEvent.next();
    }

    public view(document: FoundDocument) {
        this.viewEvent.next(document);
    }
}
