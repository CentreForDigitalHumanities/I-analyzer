import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { SelectItem } from 'primeng/api';
import { User, Query, Corpus } from '../../models/index';
import { CorpusService, SearchService, QueryService } from '../../services/index';
import { HistoryDirective } from '../history.directive';

@Component({
    selector: 'search-history',
    templateUrl: './search-history.component.html',
    styleUrls: ['./search-history.component.scss']
})
export class SearchHistoryComponent extends HistoryDirective implements OnInit {
    private user: User;
    public queries: Query[];
    public displayCorpora = false;
    constructor(
        private searchService: SearchService,
        corpusService: CorpusService,
        private queryService: QueryService,
        private router: Router
    ) {
        super(corpusService);
    }

    async ngOnInit() {
        this.retrieveCorpora();
        this.queryService.retrieveQueries().then(
            searchHistory => {
                const sortedQueries = this.sortByDate(searchHistory);
                // not using _.sortedUniqBy as sorting and filtering takes place w/ different aspects
                this.queries = _.uniqBy(sortedQueries, query => query.query);
            });
    }

    returnToSavedQuery(query) {
        const queryModel = JSON.parse(query.query);
        const route = this.searchService.queryModelToRoute(queryModel);
        this.router.navigate(['/search', query.corpusName, route]);
        if (window) {
            window.scrollTo(0, 0);
        }
    }

}
