import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from "lodash";
import { SelectItem } from 'primeng/primeng';
import { User, Query } from '../models/index'
import { SearchService, UserService, QueryService } from '../services/index';


@Component({
    selector: 'search-history',
    templateUrl: './search-history.component.html',
    styleUrls: ['./search-history.component.scss']
})
export class SearchHistoryComponent implements OnInit {
    private user: User;
    private backupQueries: Query[];
    public queries: Query[];
    public displayCorpora: boolean = false;
    private corpora: SelectItem[];
    private selectedCorpora: string[] = [];
    constructor(private searchService: SearchService, private userService: UserService, private queryService: QueryService, private router: Router) { }

    async ngOnInit() {
        this.user = await this.userService.getCurrentUser();
        if (this.user.hasRole("admin")) {
            if (this.user.roles.length > 2) {
                this.displayCorpora = true;
                this.corpora = this.user.roles.filter(role => role.name != 'admin')
                    .map(role => {
                        return { 'label': role.name, 'value': role.name };
                    });
            }
        } else {
            if (this.user.roles.length > 1) {
                this.displayCorpora = true;
                this.corpora = this.user.roles.map(role => {
                    return { 'label': role.name, 'value': role.name };
                });
            }
        }

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

    queriesForCorpora() {
        if (this.selectedCorpora.length > 0) {
            if (this.backupQueries) {
                this.queries = this.backupQueries;
            }
            this.backupQueries = this.queries;
            this.queries = this.queries.filter(query => this.selectedCorpora.includes(query.corpusName));
        }
    }


}
