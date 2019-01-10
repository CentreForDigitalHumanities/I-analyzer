import { Component, ElementRef, OnInit, ViewChild, ViewChildren, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import "rxjs/add/operator/filter";
import "rxjs/add/observable/combineLatest";
import * as _ from "lodash";

import { Corpus, CorpusField, MultipleChoiceFilter, ResultOverview, SearchFilterData, AggregateData, SearchResults, QueryModel, FoundDocument, User, searchFilterDataToParam, searchFilterDataFromParam, SortEvent } from '../models/index';
import { CorpusService, DataService, SearchService, DownloadService, UserService, ManualService, NotificationService } from '../services/index';
import { Fieldset } from 'primeng/primeng';
import { SearchFilterComponent } from './search-filter.component';
import { tickStep } from 'd3';

@Component({
    selector: 'ia-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
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
     * Two sets to hold indices of filters that are active or slumbered (recently deactivated)
     */
    public activeFilterSet: Set<string> = new Set(null);
    public slumberedFilterSet: Set<string> = new Set(null);
    /**
     * The next two members facilitate a p-multiSelect in the template.
     */
    public availableFields: CorpusField[];
    public selectedFields: CorpusField[];
    public csvCoreFields: CorpusField[];
    public searchFieldCoreFields: CorpusField[];
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

    public searchResults: { [fieldName: string]: any }[];
    private multipleChoiceFilters: { name: string, size: number }[];

    private resultsCount: number = 0;
    private tabIndex: number;


    constructor(private corpusService: CorpusService,
        private dataService: DataService,
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
                this.queryText = params.get('query');
                this.setCorpus(corpus);
                let fieldsSet = this.setFieldsFromParams(this.corpus.fields, params);
                this.setSortFromParams(this.corpus.fields, params);
                // find which fields are multiple choice fields (so we can show their options when searching)
                this.multipleChoiceFilters = this.corpus.fields
                    .filter(field => field.searchFilter && field.searchFilter.name == "MultipleChoiceFilter")
                    .map(d => ({ name: d.name, size: (<MultipleChoiceFilter>d.searchFilter).options.length }));
                this.csvCoreFields = this.corpus.fields.filter(field => field.csvCore);
                this.searchFieldCoreFields = this.corpus.fields.filter(field => field.searchFieldCore);
                if (fieldsSet || params.has('query')) {
                    this.performSearch();
                }
            });
    }

    ngOnDestroy() {
        this.searchService.clearESScroll(this.corpus, this.results);
    }

    @HostListener("window:scroll", [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown = this.searchSection.nativeElement.getBoundingClientRect().y == 0;
    }


    /**
     * turn a filter on/off via the filter icon
     */
    public toggleFilter(name: string) {
        let field = this.queryField[name];
        let activated = !field.useAsFilter;
        this.applyFilter(name, activated)
    }

    public applyFilter(name: string, activated: boolean) {
        let field = this.queryField[name];
        field.useAsFilter = activated;
        if (activated) {
            this.activeFilterSet.add(name);
        }
        else {
            this.activeFilterSet.delete(name);
        }
        this.search();
    }

    public resetFilter(name: string) {
        // reset the filter to its default data
        let filter = this.filterComponents.find(f => f.field.name === name)
        filter.update(true);

        // turn the filter off
        this.queryField[name].useAsFilter = false;
        this.activeFilterSet.delete(name);
        this.search();
    }

    public toggleActiveFilters() {
        //if any filters are active, disable them and put them in 'slumber'
        if (this.activeFilterSet.size > 0) {
            this.activeFilterSet.forEach(f => {
                this.queryField[f].useAsFilter = false;
                this.slumberedFilterSet.add(f);
                this.activeFilterSet.delete(f);
            })
        }
        // if no filters are active, activate any slumbered filters
        else {
            this.slumberedFilterSet.forEach(f => {
                this.queryField[f].useAsFilter = true;
                this.activeFilterSet.add(f)
                this.slumberedFilterSet.delete(f);
            })
        }
        this.search();
    }

    public resetAllFilters() {
        // reset all filters to their default data
        this.filterComponents.forEach(f => {
            f.update(true)
        });

        // deactivate all filters, do not slumber them
        let filters = Object.values(this.queryField);
        _.mapValues(filters, f => { f.useAsFilter = false });

        this.activeFilterSet = new Set(null);
        this.slumberedFilterSet = new Set(null);
        this.search();
    }

    public changeSorting(event: SortEvent) {
        this.sortField = event.field;
        this.sortAscending = event.ascending;
        this.search();
    }

    public search() {
        let queryModel = this.createQueryModel();
        let route = this.searchService.queryModelToRoute(queryModel);
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
        this.queryModel = this.createQueryModel();
        this.hasModifiedFilters = false;
        this.isSearching = true;

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
        let queryModel = _.cloneDeep(this.queryModel);
        // get the filter's choices, based on all other filters' choices, but not this filter's choices
        if (queryModel.filters) {
            let index = queryModel.filters.findIndex(f => f.fieldName == filter.name);
            if (index >= 0) {
                queryModel.filters.splice(index, 1);
            }
        }
        return this.searchService.aggregateSearch(this.corpus, queryModel, [filter]).then(results => {
            return results.aggregations;
        }, error => {
            console.trace(error);
            return {};
        })
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
        let previousData = this.queryField[name].data;
        this.queryField[name].data = data;
        if (data.filterName == 'MultipleChoiceFilter' && data.data.length == 0) {
            // empty multiple choice filters are automatically deactivated
            this.applyFilter(name, false);
        }
        else if (previousData != null && previousData != data) {
            this.applyFilter(name, true);
        }
        this.changeDetectorRef.detectChanges();
    }

    public toggleGreyOutFilter(name: string, greyedOut: boolean) {
        this.queryField[name].greyedOut = greyedOut;
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
        this.manualService.showManualPage('query');
    }

    public showCorpusInfo(corpus: Corpus) {
        this.manualService.showDescriptionPage(corpus);
    }

    private getCsvFields(): CorpusField[] {
        return Object.values(this.queryField).filter(field => !field.hidden && field.downloadInCsv);
    }

    private getQueryFields(): string[] | null {
        let fields = this.selectedFields.map(field => field.name);
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
            if (!this.queryField) {
                this.queryField = {};
                this.selectedFields = [];
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
                    downloadInCsv: true,
                    greyedOut: false
                }, field);
            } else {
                // this field is not found in the route
                let auxField = Object.assign({
                    data: null,
                    useAsFilter: false,
                    downloadInCsv: true,
                    greyedOut: false
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

        this.availableFields = Object.values(this.queryField).filter(field => field.searchable);
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

type QueryField = CorpusField & {
    data: SearchFilterData,
    useAsFilter: boolean,
    downloadInCsv: boolean,
    greyedOut: boolean
};
