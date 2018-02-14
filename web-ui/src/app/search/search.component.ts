import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { Corpus, CorpusField, SearchFilterData, SearchResults, QueryModel, User, FoundDocument } from '../models/index';
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
    public showFilters: boolean = false;
    public query: string;
    public user: User;
    public queryField: { [name: string]: (CorpusField & { data: any, useAsFilter: boolean, visible: boolean }) };
    public queryModel: QueryModel;
    /**
     * This is the query currently used for searching,
     * it might differ from what the user is currently typing in the query input field.
     */
    public queryText: string;
    public results: SearchResults;

    public searchResults: { [fieldName: string]: any }[];
    private selectedAll: boolean = true;

    private subscription: Subscription | undefined;

    constructor(private corpusService: CorpusService, private downloadService: DownloadService, private searchService: SearchService, private userService: UserService, private activatedRoute: ActivatedRoute, private title: Title) {
    }

    ngOnInit() {
        this.availableCorpora = this.corpusService.get();
        this.user = this.userService.getCurrentUserOrFail();
        this.activatedRoute.paramMap.subscribe(params => {
            let corpusName = params.get('corpus');
            this.availableCorpora.then(items => {
                let found = items.find(corpus => corpus.name == corpusName);
                if (!found) {
                    throw `Invalid corpus ${corpusName} specified!`;
                }
                this.corpus = found;
                this.title.setTitle(this.corpus.name);
                this.queryField = {};
                for (let field of this.corpus.fields) {
                    this.queryField[field.name] = Object.assign({ data: null, useAsFilter: false, visible: true }, field);
                }

                if (this.corpus.fields.filter( field => field.termFrequency ).length>0) {
                    this.showVisualizationButton = true;
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
        this.queryModel = this.searchService.makeQueryModel(this.queryText, this.getFilterData());
        this.searchService.search(
            this.queryModel,
            this.corpus)
            .then(results => {
                this.results = results;
                this.isSearching = false;
                this.searched = true;
            });
        this.showFilters = true;
    }

    public visualize() {
        this.showVisualization = true;
    }

    public async download() {
        let fields = this.getCsvDownloadFields();
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

    public updateFilterData(name: string, data: any) {
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

    private getCsvDownloadFields(): CorpusField[] {
        return Object.values(this.queryField).filter(field => !field.hidden && field.visible);
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
