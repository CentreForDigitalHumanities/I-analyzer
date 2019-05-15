import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import "rxjs/add/operator/filter";
import "rxjs/add/observable/combineLatest";
import * as _ from "lodash";

import { Corpus, CorpusField, MultipleChoiceFilterData, ResultOverview, SearchFilter, AggregateData, QueryModel, FoundDocument, User, searchFilterDataToParam, searchFilterDataFromParam, SortEvent } from '../models/index';
import { CorpusService, DataService, SearchService, DialogService, UserService, NotificationService } from '../services/index';

@Component({
    selector: 'ia-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
    @ViewChild('searchSection')
    public searchSection: ElementRef;
    public isScrolledDown: boolean;

    public corpus: Corpus;

    /**
     * The filters have been modified.
     */
    public hasModifiedFilters: boolean = false;
    public isSearching: boolean;
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

    private resultsCount: number = 0;
    private tabIndex: number;
    public searchBarHeight: number;

    private searchFilters: SearchFilter [] = [];
    private activeFilters: SearchFilter [] = [];

    constructor(private corpusService: CorpusService,
        private dataService: DataService,
        private searchService: SearchService,
        private userService: UserService,
        private dialogService: DialogService,
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private router: Router) {
        }

    async ngOnInit() {
        this.user = await this.userService.getCurrentUser();
        Observable.combineLatest(
            this.corpusService.currentCorpus,
            this.activatedRoute.paramMap,
            (corpus, params) => {
                return { corpus, params };
            }).filter(({ corpus, params }) => !!corpus)
            .subscribe(({ corpus, params }) => {
                this.queryText = params.get('query');
                this.setCorpus(corpus);
                this.setFiltersFromParams(this.searchFilters, params);
                this.setSearchFieldsFromParams(params);
                this.setSortFromParams(this.corpus.fields, params);
                let queryModel = this.createQueryModel();
                if (this.queryModel !== queryModel) {
                    this.aggregateSearchForMultipleChoiceFilters();
                    this.queryModel = queryModel;
                }
            });
    }

    @HostListener("window:scroll", [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown = this.searchSection.nativeElement.getBoundingClientRect().y == 0;
    }

    public toggleActiveFilters() {
        this.searchFilters.forEach(filter => filter.useAsFilter=false);
        this.dataService.pushNewFilterData(this.searchFilters);
        this.search();
    }

    public resetAllFilters() {
        this.searchFilters.forEach(filter => filter.currentData = filter.defaultData);
        this.toggleActiveFilters();
    }

    public changeSorting(event: SortEvent) {
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
            this.aggregateSearchForMultipleChoiceFilters();
        } else {
            this.router.navigateByUrl(url);
        }
    }

    private aggregateSearchForMultipleChoiceFilters() {
        let multipleChoiceFilters = this.searchFilters.filter(f => f.defaultData.filterType==="MultipleChoiceFilter");
        let aggregateResultPromises = multipleChoiceFilters.map(filter => this.getMultipleChoiceFilterOptions(filter));
        Promise.all(aggregateResultPromises).then(results => {
            results.forEach(result => {
                let filter = multipleChoiceFilters.find(f => f.fieldName===Object.keys(result)[0])
                let currentData = filter.currentData as MultipleChoiceFilterData;
                currentData.optionsAndCounts = result[filter.fieldName];
            })
            this.dataService.pushNewFilterData(this.searchFilters);
        });
    }

    async getMultipleChoiceFilterOptions(filter: SearchFilter): Promise<AggregateData> {
        let filters = _.cloneDeep(this.searchFilters.filter(f => f.useAsFilter===true));
        // get the filter's choices, based on all other filters' choices, but not this filter's choices
        if (filters.length>0) {
            let index = filters.findIndex(f => f.fieldName == filter.fieldName);
            if (index >= 0) {
                filters.splice(index, 1);
            }
        }
        else filters = null;
        let queryModel = this.searchService.createQueryModel(this.queryText, this.getQueryFields(), filters);
        let defaultData = filter.defaultData as MultipleChoiceFilterData;
        let aggregator = {name: filter.fieldName, size: defaultData.options.length}
        return this.searchService.aggregateSearch(this.corpus, queryModel, [aggregator]).then(results => {
            return results.aggregations;
        }, error => {
            console.trace(error);
            return {};
        })
    }

    

    /**
     * Event triggered from search-filter.component
     * @param filterData 
     */
    public updateFilterData(filter: SearchFilter) {
        let index = this.searchFilters.findIndex(f => f.fieldName === filter.fieldName);
        this.searchFilters[index] = filter;
        this.search();
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

    private getQueryFields(): string[] | null {
        let fields = this.selectedSearchFields.map(field => field.name);
        if (!fields.length) return null;
        return fields;
    }

    private createQueryModel() {
        this.activeFilters = this.searchFilters.filter(filter => filter.useAsFilter);
        return this.searchService.createQueryModel(this.queryText, this.getQueryFields(), this.activeFilters, this.sortField, this.sortAscending);
    }

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */

    private setCorpus(corpus: Corpus) {
        if (!this.corpus || this.corpus.name != corpus.name) {
            this.corpus = corpus;
            this.availableSearchFields = Object.values(this.corpus.fields).filter(field => field.searchable);
            this.selectedSearchFields = [];
            this.queryModel = null;
            this.searchFilters = this.corpus.fields.filter(field => field.searchFilter).map(field => field.searchFilter);
        }
    }

    /**
     * Set the filter data from the query parameters and return whether any filters were actually set.
     */
    setFiltersFromParams(searchFilters: SearchFilter[], params: ParamMap) {
        searchFilters.forEach( f => {
            let param = this.searchService.getParamForFieldName(f.fieldName);
            if (params.has(param)) {
                if (this.showFilters == undefined) {
                    this.showFilters = true;
                }
                let filterSettings = params.get(param).split(',');
                if (filterSettings[0] == "") filterSettings = [];
                f.currentData = searchFilterDataFromParam(f.fieldName, f.currentData.filterType, filterSettings);
                f.useAsFilter = true;
            }
            else {
                f.useAsFilter = false;
            }
        })
    }

    private setSearchFieldsFromParams(params: ParamMap) {
        if (params.has('fields')) {
            let queryRestriction = params.get('fields').split(',');
            this.selectedSearchFields = queryRestriction.map(
                fieldName => this.corpus.fields.find(
                    field => field.name === fieldName
                )
            );
        }
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
        this.selectedSearchFields = selection;
        this.search();
    }
}
