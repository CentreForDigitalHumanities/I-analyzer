
import {combineLatest as observableCombineLatest } from 'rxjs';

import {filter} from 'rxjs/operators';
import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/combineLatest';
import * as _ from 'lodash';

import { Corpus, CorpusField, ResultOverview, SearchFilter, SearchFilterData, searchFilterDataFromParam, QueryModel, User, SortEvent } from '../models/index';
import { CorpusService, DialogService, SearchService, UserService } from '../services/index';

@Component({
    selector: 'ia-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
    /**
     * Watch the full content of the page, in order to calculate its height
     * (after results are rendered, see event on ia-search-results / on ResultsRendered).
     * Required to support displaying search page in iframe.
     */
    @ViewChild('fullContent')
    public _fullContent: ElementRef;

    @ViewChild('searchSection')
    public searchSection: ElementRef;

    /**
     * This is a constant used to ensure that, when we are displayed in an iframe,
     * the filters are displayed even if there are no results.
     */
    private minIframeHeight = 1150;

    public isScrolledDown: boolean;

    public corpus: Corpus;

    /**
     * The filters have been modified.
     */
    public hasModifiedFilters = false;
    public isSearching: boolean;
    public hasSearched: boolean;
    /**
     * Whether the total number of hits exceeds the download limit.
     */
    public hasLimitedResults = false;
    /**
     * Hide the filters by default, unless an existing search is opened containing filters.
     */
    public showFilters: boolean | undefined;
    public user: User;

    /**
     * The next two members facilitate a p-multiSelect in the template.
     */
    public availableSearchFields: CorpusField[];
    public selectedSearchFields: CorpusField[];
    public queryModel: QueryModel;
    /**
     * This is the query text currently entered in the interface.
     */
    public queryText: string;
    /**
     * This is the query text currently used for searching,
     * it might differ from what the user is currently typing in the query input field.
     */
    public searchQueryText: string;

    public sortAscending: boolean;
    public sortField: CorpusField | undefined;

    public resultsCount = 0;
    public tabIndex: number;

    private searchFilters: SearchFilter<SearchFilterData>[] = [];
    private activeFilters: SearchFilter<SearchFilterData>[] = [];

    constructor(private corpusService: CorpusService,
        private searchService: SearchService,
        private userService: UserService,
        private dialogService: DialogService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private elementRef: ElementRef) {

    }

    async ngOnInit() {
        this.user = await this.userService.getCurrentUser();
        observableCombineLatest(
            this.corpusService.currentCorpus,
            this.activatedRoute.paramMap,
            (corpus, params) => {
                return { corpus, params };
            }).pipe(filter(({ corpus, params }) => !!corpus))
            .subscribe(({ corpus, params }) => {
                this.queryText = params.get('query');
                this.setCorpus(corpus);
                this.tabIndex = 0;
                this.setFiltersFromParams(this.searchFilters, params);
                this.setSearchFieldsFromParams(params);
                this.setSortFromParams(this.corpus.fields, params);
                const queryModel = this.createQueryModel();
                if (this.queryModel !== queryModel) {
                    this.queryModel = queryModel;
                }
            });



        if (window.parent) {
            window.parent.postMessage(["setHeight", this.minIframeHeight], "*");
        }
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown = this.searchSection.nativeElement.getBoundingClientRect().y == 0;
    }

    public onResultsRendered(): any {
        // wrap collecting height in a setTimeout that waits 0ms.
        // Without this, height is not the correct value. It seems like rendering
        // isn't quite done or something like that. Anyhow this harmless wrapping
        // fixes it
        setTimeout(() => {
            let height = Math.max(this._fullContent.nativeElement.offsetHeight, this.minIframeHeight);
            if (window.parent) {
                window.parent.postMessage(["setHeight", height], "*");
            }
        }, 0);

    }

    public changeSorting(event: SortEvent) {
        this.sortField = event.field;
        this.sortAscending = event.ascending;
        this.search();
    }

    public search() {
        this.queryModel = this.createQueryModel();
        const route = this.searchService.queryModelToRoute(this.queryModel);
        const url = this.router.serializeUrl(this.router.createUrlTree(
            ['.', route],
            { relativeTo: this.activatedRoute },
        ));
        if (this.router.url !== url) {
            this.router.navigateByUrl(url);
        }
    }

    /**
     * Event triggered from search-results.component
     * @param input
     */
    public onSearched(input: ResultOverview) {
        this.isSearching = false;
        this.hasSearched = true;
        this.resultsCount = input.resultsCount;
        this.searchQueryText = input.queryText;
        this.hasLimitedResults = this.user.downloadLimit && input.resultsCount > this.user.downloadLimit;
    }

    public showQueryDocumentation() {
        this.dialogService.showManualPage('query');
    }

    public showCorpusInfo(corpus: Corpus) {
        this.dialogService.showDescriptionPage(corpus);
    }

    private getQueryFields(): string[] | null {
        const fields = this.selectedSearchFields.map(field => field.name);
        if (!fields.length) { return null; }
        return fields;
    }

    private createQueryModel() {
        return this.searchService.createQueryModel(
            this.queryText, this.getQueryFields(), this.activeFilters, this.sortField, this.sortAscending);
    }

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */

    private setCorpus(corpus: Corpus) {
        if (!this.corpus || this.corpus.name !==corpus.name) {
            this.corpus = corpus;
            this.availableSearchFields = Object.values(this.corpus.fields).filter(field => field.searchable);
            this.selectedSearchFields = [];
            this.queryModel = null;
            this.searchFilters = this.corpus.fields.filter(field => field.searchFilter).map(field => field.searchFilter);
            this.searchFilters.map(fil => fil.currentData = fil.defaultData);
            this.activeFilters = [];
        }
    }

    /**
     * Set the filter data from the query parameters and return whether any filters were actually set.
     */
    private setFiltersFromParams(searchFilters: SearchFilter<SearchFilterData>[], params: ParamMap) {
        searchFilters.forEach( f => {
            const param = this.searchService.getParamForFieldName(f.fieldName);
            if (params.has(param)) {
                if (this.showFilters == undefined) {
                    this.showFilters = true;
                }
                let filterSettings = params.get(param).split(',');
                if (filterSettings[0] === '') { filterSettings = []; }
                f.currentData = searchFilterDataFromParam(f.currentData.filterType, filterSettings);
                f.useAsFilter = true;
            } else {
                f.useAsFilter = false;
            }
        });
        this.activeFilters = searchFilters.filter( f => f.useAsFilter );
    }

    private setSearchFieldsFromParams(params: ParamMap) {
        if (params.has('fields')) {
            const queryRestriction = params.get('fields').split(',');
            this.selectedSearchFields = queryRestriction.map(
                fieldName => this.corpus.fields.find(
                    field => field.name === fieldName
                )
            );
        }
    }

    private setSortFromParams(corpusFields: CorpusField[], params: ParamMap) {
        if (params.has('sort')) {
            const [sortField, sortAscending] = params.get('sort').split(',');
            this.sortField = corpusFields.find(field => field.name === sortField);
            this.sortAscending = sortAscending === 'asc';
        } else {
            this.sortField = undefined;
        }
    }

    public setActiveFilters(activeFilters: SearchFilter<SearchFilterData>[]) {
        this.activeFilters = activeFilters;
        this.search();
    }

    private selectSearchFields(selection: CorpusField[]) {
        this.selectedSearchFields = selection;
        this.search();
    }
}
