import { Component, OnInit } from '@angular/core';
import { Query, User } from '../models/index'
import { UserService } from '../services/index';

@Component({
  selector: 'search-history',
  templateUrl: './search-history.component.html',
  styleUrls: ['./search-history.component.scss']
})
export class SearchHistoryComponent implements OnInit {
  private user: User;
  private queries: Query[];
  constructor(private userService: UserService) { }

  ngOnInit() {
  	this.user = this.userService.getCurrentUserOrFail();
  	this.queries = this.user.queries;
  	console.log(this.queries[0].query);
  }

}
