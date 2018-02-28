import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import "rxjs/add/operator/filter";
import "rxjs/add/observable/zip";

import { Corpus, CorpusField, SearchFilterData, SearchResults, SearchQuery, FoundDocument, User, searchFilterDataToParam, searchFilterDataFromParam } from '../models/index';
import { CorpusService, SearchService, DownloadService, UserService, ManualService } from '../services/index';

@Component({
    selector: 'app-search',
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
    public query: string;
    public user: User;
    public queryField: {
        [name: string]: QueryField
    };
    public availableQueryFields: QueryField[];
    public selectedQueryFields: QueryField[];
    public queryModel: SearchQuery;
    /**
     * This is the query currently used for searching,
     * it might differ from what the user is currently typing in the query input field.
     */
    public searchQuery: string;
    public results: SearchResults;

    public searchResults: { [fieldName: string]: any }[];
    private selectedAll: boolean = true;

    private subscription: Subscription | undefined;

    constructor(private corpusService: CorpusService,
        private downloadService: DownloadService,
        private searchService: SearchService,
        private userService: UserService,
        private manualService: ManualService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private title: Title) {
    }

    ngOnInit() {
        this.availableCorpora = this.corpusService.get();
        this.user = this.userService.getCurrentUserOrFail();

        // the search to perform is specified in the query parameters
        Observable.zip(
            this.corpusService.currentCorpus,
            this.activatedRoute.paramMap,
            (corpus, params) => {
                return { corpus, params };
            }).filter(({ corpus, params }) => !!corpus)
            .subscribe(({ corpus, params }) => {
                this.query = params.get('query');
                this.setCorpus(corpus);
                let fieldsSet = this.setFieldsFromParams(corpus.fields, params);

                if (corpus.fields.filter(field => field.termFrequency).length > 0) {
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
        let searchSelection = this.selectedQueryFields;
        field.useAsFilter = true;
        // We don't allow searching and filtering by the same field.
        let indexInSelection = searchSelection.findIndex(f => f === field);
        if (indexInSelection !== -1) {
            searchSelection.splice(indexInSelection, 1);
        }
    }

    public toggleQueryField(event) {
        let toggledField = event.itemValue;
        // We don't allow searching and filtering by the same field.
        if (event.value.includes(toggledField)) {
            toggledField.useAsFilter = false;
        }
    }


    public toggleFilters() {
        this.showFilters = !this.showFilters;
    }

    public search() {
        let route = {
            query: this.query || ''
        };
        let fields = this.getQueryFields();

        if (fields) {
            route['fields'] = fields.join(',');
        }

        for (let filter of this.getFilterData().map(data => {
            return {
                param: this.getParamForFieldName(data.fieldName),
                value: searchFilterDataToParam(data)
            };
        })) {
            route[filter.param] = filter.value;
        }

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

        let minDate = this.corpus.minDate.toISOString().split('T')[0];
        let maxDate = this.corpus.maxDate.toISOString().split('T')[0];
        let queryPart = this.query ? '-' + this.query.replace(/[^a-zA-Z0-9]/g, "").substr(0, 12) : '';
        let filename = `${this.corpus.name}-${minDate}-${maxDate}${queryPart}.csv`;

        this.downloadService.downloadCsv(filename, rows, fields.map(field => field.displayName));
        this.isDownloading = false;
    }

    public updateFilterData(name: string, data: SearchFilterData) {
        if (this.hasSearched) {
            // no need to bother the user that the filters have been modified if no search has been applied yet
            this.hasModifiedFilters = true;
        }
        this.queryField[name].data = data;
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
        this.hasModifiedFilters = false;
        this.isSearching = true;
        // store it, the user might change it in the meantime
        let searchQuery = this.query;
        this.searchService.search(
            this.corpus,
            searchQuery,
            this.getFilterData(),
            this.getQueryFields())
            .then(results => {
                this.searchQuery = searchQuery;
                this.results = results;
                this.isSearching = false;
                this.hasSearched = true;
                this.queryModel = results.queryModel;
            });
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

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */
    private getParamForFieldName(fieldName: string) {
        return `$${fieldName}`;
    }

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
        }

        for (let field of corpusFields) {
            let param = this.getParamForFieldName(field.name);
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
}

type Tab = "search" | "columns";
type QueryField = CorpusField & {
    data: SearchFilterData,
    useAsFilter: boolean,
    visible: boolean
};
