import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import {
    Corpus,
    CorpusField,
    QueryModel,
    ResultOverview,
    User,
} from '../models/index';
import { ParamDirective } from '../param/param-directive';
import { AuthService } from '../services/auth.service';
import { CorpusService, DialogService } from '../services/index';
import { paramsHaveChanged } from '../utils/params';
import { filter } from 'rxjs/operators';
import { faChartColumn, faList } from '@fortawesome/free-solid-svg-icons';

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
     * This is a constant used to ensure that, when we are displayed in an iframe,
     * the filters are displayed even if there are no results.
     */
    private minIframeHeight = 1300;

    /**
     * The filters have been modified.
     */
    public isSearching: boolean;
    public hasSearched: boolean;
    /**
     * Whether the total number of hits exceeds the download limit.
     */
    public hasLimitedResults = false;

    public user: User;

    tabIcons = {
        searchResults: faList,
        visualizations: faChartColumn,
    };

    activeTab: string;

    protected corpusSubscription: Subscription;

    public queryModel: QueryModel;
    /**
     * This is the query text currently entered in the interface.
     */
    public queryText: string;

    public resultsCount = 0;

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
        this.user = await this.authService.getCurrentUserPromise();
        this.corpusSubscription = this.corpusService.currentCorpus
            .pipe(filter((corpus) => !!corpus))
            .subscribe((corpus) => {
                this.setCorpus(corpus);
            });

        if (window.parent) {
            // iframe support
            window.parent.postMessage(['setHeight', this.minIframeHeight], '*');
        }
    }

    teardown() {
        this.user = undefined;
        this.corpusSubscription.unsubscribe();
    }

    setStateFromParams(params: ParamMap) {
        this.showVisualization = params.has('visualize') ? true : false;
        if (paramsHaveChanged(this.queryModel, params)) {
            this.setQueryModel(false);
        }
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
        this.hasLimitedResults =
            this.user.downloadLimit &&
            input.resultsCount > this.user.downloadLimit;
    }

    public showQueryDocumentation() {
        this.dialogService.showManualPage('query');
    }

    public search() {
        this.queryModel.setQueryText(this.queryText);
    }

    /**
     * Escape field names these so they won't interfere with any other parameter (e.g. query)
     */

    private setCorpus(corpus: Corpus) {
        if (!this.corpus || this.corpus.name !== corpus.name) {
            const reset = !_.isUndefined(this.corpus);
            this.corpus = corpus;
            this.setQueryModel(reset);
        }
    }

    private setQueryModel(reset: boolean) {
        const params = reset ? undefined : this.route.snapshot.queryParamMap;
        const queryModel = new QueryModel(this.corpus, params);
        this.queryModel = queryModel;
        this.queryText = queryModel.queryText;
        this.queryModel.update.subscribe(() => {
            this.queryText = this.queryModel.queryText;
            this.setParams(this.queryModel.toRouteParam());
        });
    }
}
