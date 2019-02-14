import { Component, ElementRef, OnInit, ViewChild, ViewChildren, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import "rxjs/add/operator/filter";
import "rxjs/add/observable/combineLatest";
import * as _ from "lodash";

import { Corpus, CorpusField, QueryField, MultipleChoiceFilter, ResultOverview, SearchFilterData, AggregateData, SearchResults, QueryModel, FoundDocument, User, searchFilterDataToParam, searchFilterDataFromParam, SortEvent } from '../models/index';
import { CorpusService, DataService, SearchService, DialogService, DownloadService, UserService, NotificationService } from '../services/index';
import { Fieldset } from 'primeng/primeng';
import { SearchFilterComponent } from './search-filter.component';
import { tickStep } from 'd3';

@Component({
    selector: 'ia-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
    @ViewChild('searchSection')
    public searchSection: ElementRef;
    public isScrolledDown: boolean;

    @ViewChildren(SearchFilterComponent) filterComponents;
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
    public availableSearchFields: CorpusField[];
    public availableCsvFields: CorpusField[];
    public selectedFields: CorpusField[];
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

    public multipleChoiceData: AggregateData = {};

    public sortAscending: boolean;
    public sortField: CorpusField | undefined;

    private multipleChoiceFilters: { name: string, size: number }[];

    private resultsCount: number = 0;
    private tabIndex: number;

    private filterData: SearchFilterData[] = [];
    public resetFilters: boolean = false;

    public isModalActive: boolean = false;
    public isModalActiveError: boolean = false;

    private corpusChanged: boolean = false;

    constructor(private corpusService: CorpusService,
        private dataService: DataService,
        private downloadService: DownloadService,
        private searchService: SearchService,
        private userService: UserService,
        private dialogService: DialogService,
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private title: Title) {
    }

    async ngOnInit() {
        this.availableCorpora = this.corpusService.get();
        this.user = await this.userService.getCurrentUser();
        // the search to perform is specified in the query parameters
        Observable.combineLatest(
            this.corpusService.currentCorpus,
            this.activatedRoute.paramMap,
            (corpus, params) => {
                return { corpus, params };
            }).filter(({ corpus, params }) => !!corpus)
            .subscribe(({ corpus, params }) => {
                if (params.get('corpus')===corpus.name) {
                    this.queryText = params.get('query');
                    if (this.corpus != corpus) {
                        this.setCorpus(corpus);
                    }
                    let fieldsSet = this.setFieldsFromParams(this.corpus.fields, params);
                    this.setSortFromParams(this.corpus.fields, params);
                    if (this.queryText || fieldsSet) {
                        this.createQueryModel();
                        console.log(this.queryModel);
                        this.performSearch();
                    }
                }
            });
    }

    @HostListener("window:scroll", [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown = this.searchSection.nativeElement.getBoundingClientRect().y == 0;
    }

    public toggleActiveFilters() {
        this.filterData = [];
        this.filterComponents.forEach(filter => filter.useAsFilter = false);
        this.search();
    }

    public resetAllFilters() {
        this.resetFilters = true;
        this.toggleActiveFilters();
    }

    public changeSorting(event: SortEvent) {
        console.log("changing sorting");
        this.sortField = event.field;
        this.sortAscending = event.ascending;
        this.search();
    }

    public search() {
        this.queryModel = this.createQueryModel();
        let route = this.searchService.queryModelToRoute(this.queryModel);
        let url = this.router.serializeUrl(this.router.createUrlTree(
            ['.', route],
            { relativeTo: this.activatedRoute },
        ));
        if (this.router.url === url) {
            this.performSearch();
        } else {
            this.router.navigateByUrl(url);
        }
    }

    private performSearch() {
        this.hasModifiedFilters = false;
        this.isSearching = true;
        this.corpusChanged = false;

        Promise.all(this.multipleChoiceFilters.map(filter => this.getMultipleChoiceFilterOptions(filter))).then(filters => {
            let output: AggregateData = {};
            filters.forEach(filter => {
                Object.assign(output, filter);
            })
            this.multipleChoiceData = output;
            this.showFilters = true;
            this.dataService.pushNewFilterData(this.multipleChoiceData);
        });
    }

    async getMultipleChoiceFilterOptions(filter: { name: string, size: number }): Promise<AggregateData> {
        let filters = _.cloneDeep(this.filterData);
        // get the filter's choices, based on all other filters' choices, but not this filter's choices
        if (filters) {
            let index = filters.findIndex(f => f.fieldName == filter.name);
            if (index >= 0) {
                filters.splice(index, 1);
            }
        }
        let queryModel = this.searchService.createQueryModel(this.queryText, this.getQueryFields(), filters);
        return this.searchService.aggregateSearch(this.corpus, queryModel, [filter]).then(results => {
            return results.aggregations;
        }, error => {
            console.trace(error);
            return {};
        })
    }

    /**
     * called by download csv button. Large files are rendered in backend via Celery async task and an email is send with download link from backend
     */
    public choose_download_method() {
        if (this.resultsCount < 1000) {
            this.download();
        }
        else {
            this.download_asc();
        }
    }

    /**
     * backend async downloading of csv
     */
    public download_asc() {
        this.searchService.download_async(this.corpus, this.queryModel).then(result => {
            if (result) {
                this.toggleModal();
            }
            else {
                this.toggleModalError();
            }

        }, error => {
            console.trace(error);
        });
    }

    /**
     * modal pops up after connecting to backend api to start creating csv
     */
    toggleModal() {
        this.isModalActive = !this.isModalActive;
    }

    /**
     * modal pops up after connecting to backend api and there was an error
     */
    toggleModalError() {
        this.isModalActiveError = !this.isModalActiveError;
    }

    /**
     * direct download for less than x results
     */
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

    public updateFilterData(filterData: SearchFilterData) {
        let index = this.filterData.findIndex(f => f.fieldName === filterData.fieldName);
        if (index >= 0) {
            if (filterData.useAsFilter === false) {
                this.filterData.splice(index, 1)
            }
            else this.filterData[index] = filterData;
        }
        else {
            if (filterData.useAsFilter) {
                this.filterData.push(filterData);
            }
        }
        this.resetFilters = false;
        this.search();
        // let previousData = this.queryField[name].data;
        // this.queryField[name].data = data;
        // if (data.filterName == 'MultipleChoiceFilter' && data.data.length == 0) {
        //     // empty multiple choice filters are automatically deactivated
        //     console.log("deactivating filter: ", name);
        //     this.applyFilter(name, false);
        // }
        // else if (previousData != null && previousData != data) {
        //     console.log("activating filter: ", name)
        //     this.applyFilter(name, true);
        // }
        // this.changeDetectorRef.detectChanges();
    }

    public onSearched(input: ResultOverview) {
        this.isSearching = false;
        this.hasSearched = true;
        this.resultsCount = input.resultsCount;
        this.searchQueryText = input.queryText;
        this.hasLimitedResults = this.user.downloadLimit && input.resultsCount > this.user.downloadLimit;
    }

    public onViewDocument(document: FoundDocument) {
        this.showDocument = true;
        this.viewDocument = document;
    }

    public showQueryDocumentation() {
        this.dialogService.showManualPage('query');
    }

    public showCorpusInfo(corpus: Corpus) {
        this.dialogService.showDescriptionPage(corpus);
    }

    private getCsvFields(): CorpusField[] {
        return Object.values(this.corpus.fields).filter(field => !field.hidden && field.downloadable);
    }

    private getQueryFields(): string[] | null {
        let fields = this.selectedFields.map(field => field.name);
        if (!fields.length) return null;
        return fields;
    }

    private createQueryModel() {
        return this.searchService.createQueryModel(this.queryText, this.getQueryFields(), this.filterData, this.sortField, this.sortAscending);
    }

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */

    private setCorpus(corpus: Corpus) {
        if (!this.corpus || this.corpus.name != corpus.name) {
            this.selectedFields = [];
            this.showFilters = true;
            this.corpus = corpus;
            this.queryField = {};
            this.queryModel = null;
            this.title.setTitle(this.corpus.name);
            this.filterData = [];
            // calculate multiple choice filters for this corpus
            this.multipleChoiceFilters = this.corpus.fields
                .filter(field => field.searchFilter && field.searchFilter.name == "MultipleChoiceFilter")
                .map(d => ({ name: d.name, size: (<MultipleChoiceFilter>d.searchFilter).options.length }));
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
            this.selectedFields = [];
        }

        for (let field of corpusFields) {
            let param = this.searchService.getParamForFieldName(field.name);
            if (params.has(param)) {
                if (this.showFilters == undefined) {
                    this.showFilters = true;
                }
                fieldsSet = true;
                let filterSettings = params.get(param).split(',');
                if (filterSettings[0] == "") filterSettings = [];
                this.queryField[field.name] = Object.assign({
                    data: searchFilterDataFromParam(field.name, field.searchFilter.name, filterSettings),
                    useAsFilter: true,
                    visible: false
                }, field);
            } else {
                // this field is not found in the route
                let auxField = Object.assign({
                    data: null,
                    useAsFilter: false,
                    visible: false
                }, field);
                // in case there have been some settings before (i.e., from a deactivated filter), retain them
                if (this.queryField[field.name]) {
                    this.queryField[field.name].useAsFilter = false;
                }
                else {
                    this.queryField[field.name] = auxField;
                }
                if (queryRestriction.includes(field.name)) {
                    this.selectedFields.push(auxField);
                }
            }
        }
        this.availableSearchFields = Object.values(this.queryField).filter(field => field.searchable);
        this.availableCsvFields = Object.values(this.queryField).filter(field => field.downloadable);
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

    private tabChange(event) {
        this.tabIndex = event.index;
    }

    private selectSearchFieldsEvent(selection: CorpusField[]) {
        this.selectedFields = selection;
        this.hasModifiedFilters = true;
    }

    private selectCsvFieldsEvent(selection: CorpusField[]) {
        let fields = selection.map(field => field.name);
        // set first that no fields are downloaded, then set only the selected ones to download
        Object.values(this.queryField).forEach(field => field.downloadInCsv = false);
        Object.values(this.queryField).filter(
            field => _.indexOf(fields, field.name) != -1).forEach(
                field => field.downloadInCsv = true);
    }
}
