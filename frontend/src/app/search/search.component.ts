
import {combineLatest as combineLatest } from 'rxjs';
import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import * as _ from 'lodash';

import { Corpus, CorpusField, ResultOverview, SearchFilter, SearchFilterData, searchFilterDataFromParam, adHocFilterFromField, QueryModel, User, SortEvent, searchFilterDataToParam, searchFilterDataFromField } from '../models/index';
import { CorpusService, DialogService, SearchService, UserService } from '../services/index';
import { faDiagramProject, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const HIGHLIGHT = 200;

type searchFilterSettings = {
    [fieldName: string]: SearchFilterData;
};

@Component({
    selector: 'ia-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
    @ViewChild('searchSection', {static: false})
    public searchSection: ElementRef;

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
    public sortField: CorpusField | 'default' | undefined;
    public defaultSortField: CorpusField | undefined;

    public resultsCount = 0;
    public tabIndex: number;

    private searchFilters: SearchFilter<SearchFilterData> [] = [];
    private activeFilters: SearchFilter<SearchFilterData> [] = [];

    public highlight: number = HIGHLIGHT;

    searchIcon = faMagnifyingGlass;
    wordModelsIcon = faDiagramProject;


    constructor(private corpusService: CorpusService,
        private searchService: SearchService,
        private userService: UserService,
        private dialogService: DialogService,
        private activatedRoute: ActivatedRoute,
        private router: Router) {
        }

    async ngOnInit() {
        this.user = await this.userService.getCurrentUser();
        combineLatest(
            this.corpusService.currentCorpus,
            this.activatedRoute.paramMap,
            (corpus, params) => {
                return { corpus, params };
            }).filter(({ corpus, params }) => !!corpus)
            .subscribe(({ corpus, params }) => {
                this.queryText = params.get('query');
                this.setCorpus(corpus);
                this.tabIndex = 0;
                this.setFiltersFromParams(this.searchFilters, params);
                this.setSearchFieldsFromParams(params);
                this.setSortFromParams(this.corpus.fields, params);
                this.setHighlightFromParams(params);
                const queryModel = this.createQueryModel();
                if (this.queryModel !== queryModel) {
                    this.queryModel = queryModel;
                }
            });
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown = this.searchSection.nativeElement.getBoundingClientRect().y === 0;
    }

    public changeSorting(event: SortEvent) {
        this.sortField = event.field;
        this.sortAscending = event.ascending;
        this.search();
    }

    public changeHighlightSize(event: number) {
        this.highlight = event;
        this.search();
    }

    public search() {
        this.queryModel = this.createQueryModel();
        const route = this.searchService.queryModelToRoute(this.queryModel, this.useDefaultSort);
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
        if (!this.selectedSearchFields) { return null; }

        const fields = _.flatMap(this.selectedSearchFields, field => {
            const multifields = this.searchableMultifields(field);
            return [field.name].concat(multifields);
        });

        if (!fields.length) { return null; }
        return fields;
    }

    /**
     * returns array of all searchable subfields for a field.
     * empty array if there are none.
    */
    private searchableMultifields(field: CorpusField): string[] {
        if (field && field.multiFields) {
            // list known searchable subfields (a numeric field like `length` should not be included)
            const searchables = ['clean', 'stemmed', 'text'];
            const subfields = field.multiFields.filter(subfield =>
                searchables.includes(subfield)
            );
            const fullNames = subfields.map(subfield => `${field.name}.${subfield}`);
            return fullNames;
        } else {
            return [];
        }
    }

    private createQueryModel() {
        const sortField = this.useDefaultSort ? this.defaultSortField : this.sortField as CorpusField | undefined;

        return this.searchService.createQueryModel(
            this.queryText, this.getQueryFields(), this.activeFilters, sortField, this.sortAscending, this.highlight);
    }

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */

    private setCorpus(corpus: Corpus) {
        if (!this.corpus || this.corpus.name !== corpus.name) {
            this.corpus = corpus;
            this.availableSearchFields = Object.values(this.corpus.fields).filter(field => field.searchable);
            this.selectedSearchFields = [];
            this.queryModel = null;
            this.searchFilters = this.corpus.fields.filter(field => field.searchFilter).map(field => field.searchFilter);
            this.activeFilters = [];
            this.defaultSortField = this.corpus.fields.find(field => field.primarySort);
        }
    }

    /**
     * Set the filter data from the query parameters and return whether any filters were actually set.
     */
    private setFiltersFromParams(searchFilters: SearchFilter<SearchFilterData>[], params: ParamMap) {
        const filterSettings = this.filterSettingsFromParams(params);
        this.applyFilterSettings(searchFilters, filterSettings);
    }

    private filterSettingsFromParams(params: ParamMap): searchFilterSettings {
        const settings = {};
        this.corpus.fields.forEach(field => {
            const param = this.searchService.getParamForFieldName(field.name);
            if (params.has(param)) {
                let filterSettings = params.get(param).split(',');
                if (filterSettings[0] === '') { filterSettings = []; }
                const filterType = field.searchFilter ? field.searchFilter.currentData.filterType : undefined;
                const data = searchFilterDataFromParam(filterType, filterSettings, field);
                settings[field.name] = data;
            }
        });
        return settings;
    }

    private applyFilterSettings(searchFilters: SearchFilter<SearchFilterData>[], filterSettings: searchFilterSettings) {
        this.setAdHocFilters(searchFilters, filterSettings);

        searchFilters.forEach(f => {
            if (_.has(filterSettings, f.fieldName)) {
                if (this.showFilters === undefined) {
                    this.showFilters = true;
                }
                const data = filterSettings[f.fieldName];
                f.currentData = data;
                f.useAsFilter = true;
            } else {
                f.useAsFilter = false;
            }
        });
        this.activeFilters = searchFilters.filter( f => f.useAsFilter );
    }

    private setAdHocFilters(searchFilters: SearchFilter<SearchFilterData>[], filterSettings: searchFilterSettings) {
        this.corpus.fields.forEach(field => {
            if (_.has(filterSettings, field.name) && !searchFilters.find(filter => filter.fieldName ===  field.name)) {
                const adHocFilter = adHocFilterFromField(field);
                searchFilters.push(adHocFilter);
            }
        });
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
            if (params.get('query')) {
                this.sortField = undefined;
            } else {
                this.sortField = 'default';
            }
        }
    }

    private setHighlightFromParams(params: ParamMap) {
        if (params.has('highlight')) {
            this.highlight = Number(params.get('highlight'));
        } else { this.highlight = undefined; }
    }

    public setActiveFilters(activeFilters: SearchFilter<SearchFilterData>[]) {
        this.activeFilters = activeFilters;
        this.search();
    }

    public selectSearchFields(selection: CorpusField[]) {
        this.selectedSearchFields = selection;
        this.search();
    }

    public goToContext(contextValues: any[]) {
        const contextSpec = this.corpus.documentContext;

        this.queryText = undefined;
        this.sortField = contextSpec.sortField || 'default';
        this.sortAscending = contextSpec.sortDirection === 'asc';

        contextSpec.contextFields
            .filter(field => ! this.searchFilters.find(f => f.fieldName === field.name))
            .forEach(field => this.makeContextFilter(field));

        const filterSettings = _.mapValues(
            _.keyBy(contextSpec.contextFields, 'name'),
            field => searchFilterDataFromField(field, [contextValues[field.name]])
        );

        this.applyFilterSettings(this.searchFilters, filterSettings);

        this.search();
    }

    private makeContextFilter(field: CorpusField) {
        const filter = adHocFilterFromField(field);
        this.searchFilters.push(filter);
    }

    get useDefaultSort(): boolean {
        return this.sortField === 'default';
    }
}
