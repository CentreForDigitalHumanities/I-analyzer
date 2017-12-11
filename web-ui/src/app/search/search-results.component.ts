import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SearchResults } from '../models/index';

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

    @Output('download')
    public downloadEvent = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    public download() {
        this.downloadEvent.next();
    }
}
