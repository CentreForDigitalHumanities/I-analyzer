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
    private displayCorpora: boolean = false;
    constructor(private userService: UserService, private queryService: QueryService) { }

    ngOnInit() {
        /*this.user = this.userService.getCurrentUserOrFail();
        if (this.user.roles.includes("admin")) {
            if (this.user.roles.length>2) {
                this.displayCorpora = true;
            }        
        }
        else {
            if (this.user.roles.length>1) {
                this.displayCorpora = true;
            }
        }*/

        this.queryService.retrieveQueries().then(
            searchHistory => {
                this.queries = searchHistory.sort( function(a,b) { 
                    return new Date(b.started).getTime() - new Date(a.started).getTime(); 
                });
            });
    }

    returnToSavedQuery() {
        console.log("clicked!");
    }


}
