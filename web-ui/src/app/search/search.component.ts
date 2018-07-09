import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import "rxjs/add/operator/filter";
import "rxjs/add/observable/combineLatest";

import { Corpus, CorpusField, SearchFilterData, SearchResults, QueryModel, FoundDocument, User, searchFilterDataToParam, searchFilterDataFromParam, SortEvent } from '../models/index';
import { CorpusService, SearchService, DownloadService, UserService, ManualService, NotificationService } from '../services/index';

@Component({
    selector: 'ia-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
    @ViewChild('searchSection')
    public searchSection: ElementRef;
    public isScrolledDown: boolean;

    public selectedFields: string[] = [];
    public corpus: Corpus;
    public availableCorpora: Promise<Corpus[]>;

    /**
     * The filters have been modified.
     */
    public hasModifiedFilters: boolean = false;
    public isSearching: boolean;
    public isDownloading: boolean;
    public hasSearched: boolean;
    /**
     * Whether the total number of hits exceeds the download limit.
     */
    public hasLimitedResults: boolean = false;
    /**
     * Whether a document has been selected to be shown.
     */
    public showDocument: boolean = false;
    /**
     * The document to view separately.
     */
    public viewDocument: FoundDocument;
    public showVisualization: boolean = false;
    public showVisualizationButton: boolean = false;
    /**
     * Hide the filters by default, unless an existing search is opened containing filters.
     */
    public showFilters: boolean | undefined;
    public user: User;
    public queryField: {
        [name: string]: QueryField
    };
    /**
     * The next two members facilitate a p-multiSelect in the template.
     */
    public availableQueryFields: QueryField[];
    public selectedQueryFields: QueryField[];
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
    public results: SearchResults;

    public sortAscending: boolean;
    public sortField: CorpusField | undefined;

    public searchResults: { [fieldName: string]: any }[];

    /**
     * For failed searches.
     */
    public showError: false | undefined | {
        date: string,
        href: string,
        message: string
    };

    private selectedAll: boolean = true;

    private subscription: Subscription | undefined;

    constructor(private corpusService: CorpusService,
        private downloadService: DownloadService,
        private searchService: SearchService,
        private userService: UserService,
        private manualService: ManualService,
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private title: Title) {
    }

    ngOnInit() {
        this.availableCorpora = this.corpusService.get();
        this.user = this.userService.getCurrentUserOrFail();
        // the search to perform is specified in the query parameters
        Observable.combineLatest(
            this.corpusService.currentCorpus,
            this.activatedRoute.paramMap,
            (corpus, params) => {
                return { corpus, params };
            }).filter(({ corpus, params }) => !!corpus)
            .subscribe(({ corpus, params }) => {
                this.queryText = params.get('query');
                this.setCorpus(corpus);
                let fieldsSet = this.setFieldsFromParams(this.corpus.fields, params);
                this.setSortFromParams(this.corpus.fields, params);

                if (this.corpus.fields.filter(field => field.termFrequency).length > 0) {
                    this.showVisualizationButton = true;
                }

                if (fieldsSet || params.has('query')) {
                    this.performSearch();
                }
            });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    @HostListener("window:scroll", [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown = this.searchSection.nativeElement.getBoundingClientRect().y == 0;
    }

    public enableFilter(name: string) {
        let field = this.queryField[name];
        field.useAsFilter = true;
        this.toggleFilterFields();
    }

    // control whether a given filter is applied or not
    public toggleFilter(name:string, event) {
        let field = this.queryField[name]
        field.useAsFilter = !field.useAsFilter;
    }

    // fields that are used as filters aren't searched in
    public toggleFilterFields() {
        this.selectedQueryFields = this.selectedQueryFields.filter(f => !f.useAsFilter);
        // (De)selecting filters also yields different results.
        this.hasModifiedFilters = true;
    }

    // fields that are searched in aren't used as filters
    public toggleQueryFields(event) {
        // We don't allow searching and filtering by the same field.
        for (let field of event.value) {
            field.useAsFilter = false;
        }
        // Searching in different fields also yields different results.
        this.hasModifiedFilters = true;
    }

    // control whether the filters are hidden
    public toggleFilters() {
        this.showFilters = !this.showFilters;
    }

    public changeSorting(event: SortEvent) {
        this.sortField = event.field;
        this.sortAscending = event.ascending;
        this.search();
    }

    public search() {
        let queryModel = this.createQueryModel();
        let route = this.searchService.queryModelToRoute(queryModel);
        this.router.navigate(['.', route], { relativeTo: this.activatedRoute });
    }

    public visualize() {
        this.showVisualization = true;
    }

    public async download() {
        this.isDownloading = true;
        let fields = this.getCsvFields();
        let rows = await this.searchService.searchAsTable(
            this.corpus,
            this.queryModel,
            fields);

        if (this.hasLimitedResults) {
            this.notificationService.showMessage(`The download has been limited to the first ${rows.length} results!`);
        }

        let minDate = this.corpus.minDate.toISOString().split('T')[0];
        let maxDate = this.corpus.maxDate.toISOString().split('T')[0];
        let queryPart = this.searchQueryText ? '-' + this.searchQueryText.replace(/[^a-zA-Z0-9]/g, "").substr(0, 12) : '';
        let filename = `${this.corpus.name}-${minDate}-${maxDate}${queryPart}.csv`;

        this.downloadService.downloadCsv(filename, rows, fields.map(field => field.displayName));
        this.isDownloading = false;
    }

    public updateFilterData(name: string, data: SearchFilterData) {
        this.hasModifiedFilters = true;
        this.queryField[name].data = data;
        this.changeDetectorRef.detectChanges();
    }

    public onViewDocument(document: FoundDocument) {
        this.showDocument = true;
        this.viewDocument = document;
    }

    public selectAllCsvFields() {
        for (let field of this.corpus.fields) {
            this.queryField[field.name].visible = this.selectedAll;
        }
    }

    public checkIfAllSelected() {
        let fields = Object.values(this.queryField).filter(field => !field.hidden);
        this.selectedAll = fields.every(field => field.visible);
    }

    public showQueryDocumentation() {
        this.manualService.showPage('query');
    }

    private performSearch() {
        this.queryModel = this.createQueryModel();
        this.hasModifiedFilters = false;
        this.isSearching = true;
        // store it, the user might change it in the meantime
        let currentQueryText = this.queryText;
        let finallyReset = () => {
            this.isSearching = false;
            this.hasSearched = true;
            this.searchQueryText = currentQueryText;
        };
        this.searchService.search(
            this.queryModel,
            this.corpus
        ).then(results => {
            this.results = results;
            this.hasLimitedResults = this.user.downloadLimit && results.total > this.user.downloadLimit;
            finallyReset();
        }, error => {
            this.showError = {
                date: (new Date()).toISOString(),
                href: location.href,
                message: error.message || 'An unknown error occurred'
            };
            console.trace(error);
            finallyReset();
        });
        this.showFilters = true;
    }

    private getCsvFields(): CorpusField[] {
        return Object.values(this.queryField).filter(field => !field.hidden && field.visible);
    }

    private getQueryFields(): string[] | null {
        let fields = this.selectedQueryFields.map(field => field.name);
        if (!fields.length) return null;
        return fields;
    }

    private getFilterData(): SearchFilterData[] {
        let data: SearchFilterData[] = [];
        for (let fieldName of Object.keys(this.queryField)) {
            let field = this.queryField[fieldName];
            if (field.useAsFilter) {
                data.push(field.data);
            }
        }
        return data;
    }

    private createQueryModel() {
        return this.searchService.createQueryModel(this.queryText, this.getQueryFields(), this.getFilterData(), this.sortField, this.sortAscending);
    }

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */

    private setCorpus(corpus: Corpus) {
        if (!this.corpus || this.corpus.name != corpus.name) {
            if (!this.queryField || !this.corpus || corpus.name != this.corpus.name) {
                this.queryField = {};
                this.selectedQueryFields = [];
            }
            this.corpus = corpus;
            this.title.setTitle(this.corpus.name);
        }
    }

    /**
     * Sets the field data from the query parameters and return whether any fields were actually set.
     */
    private setFieldsFromParams(corpusFields: CorpusField[], params: ParamMap) {
        let fieldsSet = false;
        let queryRestriction: string[] = [];
        if (params.has('fields')) {
            queryRestriction = params.get('fields').split(',');
            this.selectedQueryFields = [];
        }

        for (let field of corpusFields) {
            let param = this.searchService.getParamForFieldName(field.name);
            if (params.has(param)) {
                if (this.showFilters == undefined) {
                    this.showFilters = true;
                }
                fieldsSet = true;
                this.queryField[field.name] = Object.assign({
                    data: searchFilterDataFromParam(field.name, field.searchFilter.name, params.get(param)),
                    useAsFilter: true,
                    visible: true
                }, field);
            } else {
                let auxField = this.queryField[field.name] = Object.assign({
                    data: null,
                    useAsFilter: false,
                    visible: true
                }, field);
                if (queryRestriction.includes(field.name)) {
                    this.selectedQueryFields.push(auxField);
                }
            }
        }

        this.availableQueryFields = Object.values(this.queryField);
        return fieldsSet;
    }

    private setSortFromParams(corpusFields: CorpusField[], params: ParamMap) {
        if (params.has('sort')) {
            let [sortField, sortAscending] = params.get('sort').split(',');
            this.sortField = corpusFields.find(field => field.name == sortField);
            this.sortAscending = sortAscending == 'asc';
        } else {
            this.sortField = undefined;
        }
    }
}

type Tab = "search" | "columns";
type QueryField = CorpusField & {
    data: SearchFilterData,
    useAsFilter: boolean, 
    visible: boolean
};
