import { Component, OnInit } from '@angular/core';
import { User, Query } from '../models/index'
import { UserService, QueryService } from '../services/index';


@Component({
    selector: 'search-history',
    templateUrl: './search-history.component.html',
    styleUrls: ['./search-history.component.scss']
})
export class SearchHistoryComponent implements OnInit {
    private user: User;
    private queries: Query[];
    private timestamps: Date [];
    constructor(private userService: UserService, private queryService: QueryService) { }

    ngOnInit() {
        this.queryService.retrieveQueries().then(
            searchHistory => {
                this.queries = searchHistory;
                console.log(this.queries);
            });
    }

    returnToSavedQuery() {
        console.log("clicked!");
    }


}
