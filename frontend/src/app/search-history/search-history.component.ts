import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { SelectItem } from 'primeng/api';
import { User, Query, Corpus } from '../models/index';
import { CorpusService, SearchService, QueryService } from '../services/index';

@Component({
    selector: 'search-history',
    templateUrl: './search-history.component.html',
    styleUrls: ['./search-history.component.scss']
})
export class SearchHistoryComponent implements OnInit {
    private user: User;
    public queries: Query[];
    public displayCorpora = false;
    private corpora: Corpus[];
    private corpusMenuItems: SelectItem[];
    constructor(
        private searchService: SearchService,
        private corpusService: CorpusService,
        private queryService: QueryService,
        private router: Router
    ) { }

    async ngOnInit() {
        this.corpusService.get().then((items) => {
            this.corpora = items;
            this.corpusMenuItems = items.map(corpus => ({ 'label': corpus.title, 'value': corpus.name }) );
        }).catch(error => {
            console.log(error);
        });
        this.queryService.retrieveQueries().then(
            searchHistory => {
                const sortedQueries = searchHistory.sort(function (a, b) {
                    return new Date(b.started).getTime() - new Date(a.started).getTime();
                });
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

    corpusTitle(corpusName: string): string {
        return this.corpora.find(corpus => corpus.name == corpusName).title || corpusName
    }

}
