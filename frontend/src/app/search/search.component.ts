import { Subscription } from 'rxjs';
import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

import { Corpus, CorpusField, ResultOverview, QueryModel, User } from '../models/index';
import { CorpusService, DialogService, } from '../services/index';
import { ParamDirective } from '../param/param-directive';
import { makeContextParams } from '../utils/document-context';
import { AuthService } from '../services/auth.service';
import { findByName } from '../utils/utils';

@Component({
    selector: 'ia-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends ParamDirective {
    @ViewChild('searchSection', { static: false })
    public searchSection: ElementRef;

    public isScrolledDown: boolean;

    public corpus: Corpus;

    /**
     * The filters have been modified.
     */
    public isSearching: boolean;
    public hasSearched: boolean;
    /**
     * Whether the total number of hits exceeds the download limit.
     */
    public hasLimitedResults = false;
    /**
     * Hide the filters by default, unless an existing search is opened containing filters.
     */
    public showFilters = true;
    public user: User;
    protected corpusSubscription: Subscription;

    public queryModel: QueryModel;
    /**
     * This is the query text currently entered in the interface.
     */
    public queryText: string;

    public resultsCount = 0;
    public tabIndex: number;

    public filterFields: CorpusField[] = [];

    public showVisualization: boolean;

    constructor(
        private authService: AuthService,
        private corpusService: CorpusService,
        private dialogService: DialogService,
        route: ActivatedRoute,
        router: Router
    ) {
        super(route, router);
    }

    async initialize(): Promise<void> {
        this.tabIndex = 0;
        this.user = await this.authService.getCurrentUserPromise();
        this.corpusSubscription = this.corpusService.currentCorpus
            .filter((corpus) => !!corpus).subscribe((corpus) => {
            this.setCorpus(corpus);
        });
    }

    teardown() {
        this.user = undefined;
        this.corpusSubscription.unsubscribe();
        this.setParams( {query: null });
    }

    setStateFromParams(params: ParamMap) {
        this.queryText = params.get('query');
        this.queryModel.setFromParams(params);
        this.tabIndex = params.has('visualize') ? 1 : 0;
        this.showVisualization = params.has('visualize') ? true : false;
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // mark that the search results have been scrolled down and we should some border
        this.isScrolledDown =
            this.searchSection.nativeElement.getBoundingClientRect().y === 0;
    }

    /**
     * Event triggered from search-results.component
     *
     * @param input
     */
    public onSearched(input: ResultOverview) {
        this.isSearching = false;
        this.hasSearched = true;
        this.resultsCount = input.resultsCount;
        this.hasLimitedResults = this.user.downloadLimit && input.resultsCount > this.user.downloadLimit;
        if (this.showVisualization) {
            this.tabIndex = 1;
        }
    }

    public showQueryDocumentation() {
        this.dialogService.showManualPage('query');
    }

    public showCorpusInfo(corpus: Corpus) {
        this.dialogService.showDescriptionPage(corpus);
    }

    public switchTabs(index: number) {
        this.tabIndex = index;
    }

    public search() {
        this.queryModel.setQueryText(this.queryText);
    }

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */

    private setCorpus(corpus: Corpus) {
        if (!this.corpus || this.corpus.name !== corpus.name) {
            this.corpus = corpus;
            this.setQueryModel();
        }
    }

    private setQueryModel() {
        this.queryModel = new QueryModel(this.corpus);
        this.queryModel.setFromParams(this.route.snapshot.paramMap);
        this.queryModel.update.subscribe(() => {
            this.setParams(this.queryModel.toRouteParam());
        });
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    public goToContext(contextValues: any) {
        const contextSpec = this.corpus.documentContext;

        const queryModel = new QueryModel(this.corpus);

        const contextFields = contextSpec.contextFields
            .filter(field => ! findByName(this.filterFields, field.name));

        contextFields.forEach(field => {
            const filter = field.makeSearchFilter();
            filter.setToValue(contextValues[field.name]);
            queryModel.addFilter(filter);
        });

        queryModel.sortBy = contextSpec.sortField;
        queryModel.sortDirection = contextSpec.sortDirection;

        this.setParams(queryModel.toRouteParam());
    }
}
