import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { Corpus, CorpusField, SearchFilterData, SearchResults, FoundDocument } from '../models/index';
import { CorpusService, SearchService, DownloadService } from '../services/index';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
    @Input() private searchData: Array<any>;

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
    public showFilters: boolean = false;
    public query: string;
    public queryField: { [name: string]: (CorpusField & { data: any, useAsFilter: boolean }) };
    /**
     * This is the query currently used for searching,
     * it might differ from what the user is currently typing in the query input field.
     */
    public searchQuery: string;
    public results: SearchResults;

    public searchResults: { [fieldName: string]: any }[];
    private barChartKey: string;

    private subscription: Subscription | undefined;

    constructor(private corpusService: CorpusService, private downloadService: DownloadService, private searchService: SearchService, private activatedRoute: ActivatedRoute, private title: Title) {
        //this.visibleTab = "search";
        // setting the aspect for which term frequencies are counted to year.
        // TODO: make several miniature visualizations for different term frequencies
        this.barChartKey = "year";
    }

    ngOnInit() {
        this.availableCorpora = this.corpusService.get();

        this.activatedRoute.params.subscribe(params => {
            let corpusName = params['corpus'];
            this.availableCorpora.then(items => {
                let found = items.find(corpus => corpus.name == corpusName);
                if (!found) {
                    throw `Invalid corpus ${corpusName} specified!`;
                }
                this.corpus = found;
                this.title.setTitle(this.corpus.name);
                this.queryField = {};
                for (let field of this.corpus.fields) {
                    this.queryField[field.name] = Object.assign({ data: null, useAsFilter: false }, field);
                }
            });
        })
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
        this.isSearching = true;
        // store it, the user might change it in the meantime
        let searchQuery = this.query;
        this.searchService.search(
            this.corpus,
            searchQuery,
            this.getQueryFields(),
            this.getFilterData())
            .then(results => {
                this.searchQuery = searchQuery;
                this.results = results;
                this.isSearching = false;
                this.searched = true;
            });
        this.showFilters = true;
    }

    public visualize() {
        this.searchResults = [];
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = this.searchService.searchObservable(
            this.corpus,
            this.query,
            this.getQueryFields(),
            this.getFilterData())
            .subscribe(searchResults => {
                // the array pointer needs to be updated for a change to be detected
                this.searchResults = this.searchResults.concat(...searchResults.documents);
                console.log(this.searchResults[0].date);
            })
    }

    public async download() {
        let fields = this.getQueryFields();
        let rows = await this.searchService.searchAsTable(
            this.corpus,
            this.query,
            fields,
            this.getFilterData());

        let minDate = this.corpus.minDate.toISOString().split('T')[0];
        let maxDate = this.corpus.maxDate.toISOString().split('T')[0];
        let queryPart = this.query ? '-' + this.query.replace(/[^a-zA-Z0-9]/g, "").substr(0, 12) : '';

        let filename = `${this.corpus.name}-${minDate}-${maxDate}${queryPart}.csv`;
        this.downloadService.downloadCsv(filename, rows, fields.map(field => field.displayName));
    }

    public updateFilterData(name: string, data: any) {
        this.queryField[name].data = data;
    }

    public onViewDocument(document: FoundDocument) {
        this.showDocument = true;
        this.viewDocument = document;
    }

    private getQueryFields(): CorpusField[] {
        return Object.values(this.queryField).filter(field => !field.hidden);
    }

    private getFilterData(): SearchFilterData[] {
        let data = [];
        for (let fieldName of Object.keys(this.queryField)) {
            let field = this.queryField[fieldName];
            if (field.useAsFilter) {
                data.push(field.data);
            }
        }
        return data;
    }
}

type Tab = "search" | "columns";
