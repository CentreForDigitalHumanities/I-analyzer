/* eslint-disable @typescript-eslint/member-ordering */
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

import { User, SearchResults, FoundDocument, QueryModel, ResultOverview } from '../models/index';
import { SearchService } from '../services';
import { ShowError } from '../error/error.component';
import { PageParameters, PageResults } from '../models/page-results';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const MAXIMUM_DISPLAYED = 10000;

@Component({
    selector: 'ia-search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnChanges {
    @ViewChild('resultsNavigation', {static: true})
    public resultsNavigation: ElementRef;

    /**
     * The search queryModel to use
     */
    @Input()
    public queryModel: QueryModel;

    @Input()
    public user: User;

    @Output('view')
    public viewEvent = new EventEmitter<{document: FoundDocument; tabIndex?: number}>();

    @Output('searched')
    public searchedEvent = new EventEmitter<ResultOverview>();

    public pageResults: PageResults;

    public isLoading = false;
    public isScrolledDown: boolean;

    public results: SearchResults;

    public resultsPerPage = 20;

    public imgSrc: Uint8Array;

    error$: Observable<ShowError>;

    /** tab on which the focused document should be opened */
    public documentTabIndex: number;

    constructor(private searchService: SearchService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.queryModel) {
            const params = {
                esQuery: this.queryModel.toEsQuery(),
                from: 0,
                size: this.resultsPerPage,
            };
            this.pageResults = new PageResults(this.searchService, this.queryModel, params);
            this.error$ = this.pageResults.error$.pipe(
                map(this.parseError)
            );
            this.pageResults.result$.subscribe(result => {
                this.searchedEvent.emit({ queryText: this.queryModel.queryText, resultsCount: result.total });
            });
        }
    }

    setParameters(parameters: PageParameters) {
        this.pageResults?.setParameters(parameters);
    }

    totalDisplayed(totalResults: number) {
        return Math.min(totalResults, MAXIMUM_DISPLAYED);
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // mark that the search results were scrolled down beyond 68 pixels from top (position underneath sticky search bar)
        // this introduces a box shadow
        if (this.resultsNavigation !== undefined) {
            this.isScrolledDown = this.resultsNavigation.nativeElement.getBoundingClientRect().y === 68;
        }
    }

    private parseError(error): ShowError {
        if (error) {
            return {
                date: (new Date()).toISOString(),
                href: location.href,
                message: error.message || 'An unknown error occurred'
            };
        }
    }
}
