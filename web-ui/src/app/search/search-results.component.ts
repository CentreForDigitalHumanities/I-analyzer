import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Corpus, SearchResults, FoundDocument } from '../models/index';

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
    public corpus: Corpus;

    @Output('download')
    public downloadEvent = new EventEmitter();

    @Output('view')
    public viewEvent = new EventEmitter<FoundDocument>();

    public get contentFieldNames() {
        return this.corpus.fields.filter(field => !field.hidden && field.displayType == 'text_content').map(field => field.name);
    }

    constructor() { }

    ngOnInit() {
    }

    public download() {
        this.downloadEvent.next();
    }

    public view(document: FoundDocument) {
        this.viewEvent.next(document);
    }
}
