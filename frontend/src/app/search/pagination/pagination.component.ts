import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { SearchParameters } from '../../models/index';

@Component({
  selector: 'ia-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnChanges {
    @Input() public totalResults: number;

    public totalPages: number;
    @Input() public fromIndex = 0;
    public resultsPerPage = 20;
    public currentPages: number[];
    public currentPage: number;

    @Output('loadResults')
    public loadResultsEvent = new EventEmitter<SearchParameters>();


    constructor() { }

    ngOnChanges() {
        this.totalPages = Math.ceil(this.totalResults / this.resultsPerPage);

        if ((this.fromIndex + 1) <= this.resultsPerPage) {
            this.currentPage = 1;
        } else {
            this.currentPage = 1 + Math.floor(this.fromIndex / this.resultsPerPage);
        }

        this.setCurrentPages(this.currentPage);
    }

    public async loadResults(page: number) {

        if (this.currentPage === page) {
            return true;
        }
        this.currentPage = page;
        this.fromIndex = (this.currentPage - 1) * this.resultsPerPage;

        this.setCurrentPages(page);

        this.loadResultsEvent.emit({from: this.fromIndex, size: this.resultsPerPage});
    }

    /** setting variables for pagination view */
    setCurrentPages(page: number) {
        if (page === 1) {
            this.currentPages = [1, 2, 3];
        } else if (page === this.totalPages && this.totalResults > this.resultsPerPage * 2) {
            this.currentPages = [this.totalPages - 2, this.totalPages - 1, this.totalPages];
        } else {
            this.currentPages = [page - 1, page, page + 1];
        }
    }

}
