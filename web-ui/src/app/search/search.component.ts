import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { Corpus, CorpusField, SearchFilterData, SearchResults, SearchQuery, FoundDocument, User, searchFilterDataToParam, searchFilterDataFromParam } from '../models/index';
import { CorpusService, SearchService, DownloadService, UserService } from '../services/index';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
    public selectedFields: string[] = [];
    public corpus: Corpus;
    public availableCorpora: Promise<Corpus[]>;

    public isSearching: boolean;
    public searched: boolean;
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
    public queryField: { [name: string]: (CorpusField & { data: SearchFilterData, useAsFilter: boolean, visible: boolean }) };
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
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private title: Title) {
    }

    ngOnInit() {
        this.availableCorpora = this.corpusService.get();
        this.user = this.userService.getCurrentUserOrFail();
        this.activatedRoute.paramMap.subscribe(params => {
            let corpusName = params.get('corpus');
            this.query = params.get('query');
            this.availableCorpora.then(items => {
                // TODO: is this actually required all the time?
                let found = items.find(corpus => corpus.name == corpusName);
                if (!found) {
                    throw `Invalid corpus ${corpusName} specified!`;
                }
                if (!this.queryField || !this.corpus || found.name != this.corpus.name) {
                    this.queryField = {};
                }
                this.corpus = found;
                this.title.setTitle(this.corpus.name);

                let fieldsSet = false;

                for (let field of this.corpus.fields) {
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
                        this.queryField[field.name] = Object.assign({ data: null, useAsFilter: false, visible: true }, field);
                    }
                }

                if (this.corpus.fields.filter(field => field.termFrequency).length > 0) {
                    this.showVisualizationButton = true;
                }

                if (fieldsSet || params.has('query')) {
                    this.performSearch();
                }
            });
        });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    public enableFilter(name: string) {
        if (!this.queryField[name].useAsFilter) {
            this.queryField[name].useAsFilter = true;
        }
    }


    public toggleFilters() {
        this.showFilters = !this.showFilters;
    }

    public search() {
        let route = {
            query: this.query || ''
        };

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
        let fields = this.getQueryFields();
        let rows = await this.searchService.searchAsTable(
            this.corpus,
            this.queryModel,
            fields);

        let minDate = this.corpus.minDate.toISOString().split('T')[0];
        let maxDate = this.corpus.maxDate.toISOString().split('T')[0];
        let queryPart = this.query ? '-' + this.query.replace(/[^a-zA-Z0-9]/g, "").substr(0, 12) : '';
        let filename = `${this.corpus.name}-${minDate}-${maxDate}${queryPart}.csv`;

        this.downloadService.downloadCsv(filename, rows, fields.map(field => field.displayName));
    }

    public updateFilterData(name: string, data: SearchFilterData) {
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

    private performSearch() {
        this.isSearching = true;
        // store it, the user might change it in the meantime
        let searchQuery = this.query;
        this.searchService.search(
            this.corpus,
            searchQuery,
            this.getFilterData())
            .then(results => {
                this.searchQuery = searchQuery;
                this.results = results;
                this.isSearching = false;
                this.searched = true;
                this.queryModel = results.queryModel;
            });
    }

    private getQueryFields(): CorpusField[] {
        return Object.values(this.queryField).filter(field => !field.hidden && field.visible);
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
}

type Tab = "search" | "columns";
