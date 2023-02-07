import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { SelectItem } from 'primeng/api';
import { User, Query } from '../models/index';
import { CorpusService, SearchService, QueryService } from '../services/index';

@Component({
    selector: 'search-history',
    templateUrl: './search-history.component.html',
    styleUrls: ['./search-history.component.scss']
})
export class SearchHistoryComponent implements OnInit {
    private user: User;
    public queries: Query[];
    public displayCorpora: boolean = false;
    private corpora: SelectItem[];
    constructor(private searchService: SearchService, private corpusService: CorpusService, private queryService: QueryService, private router: Router) { }

    async ngOnInit() {
        this.corpusService.get().then((items) => {
            this.corpora = items.map(corpus => {return { 'label': corpus.name, 'value': corpus.name } });
        }).catch(error => {
            console.log(error);
        });
        this.queryService.retrieveQueries().then(
            searchHistory => {
                let sortedQueries = searchHistory.sort(function (a, b) {
                    return new Date(b.started).getTime() - new Date(a.started).getTime();
                });
                // not using _.sortedUniqBy as sorting and filtering takes place w/ different aspects
                this.queries = _.uniqBy(sortedQueries, query => query.query);
            });
    }

    returnToSavedQuery(query) {
        let queryModel = JSON.parse(query.query);
        let route = this.searchService.queryModelToRoute(queryModel);
        this.router.navigate(['/search', query.corpusName, route]);
        if (window) {
            window.scrollTo(0, 0);
        }
    }
}