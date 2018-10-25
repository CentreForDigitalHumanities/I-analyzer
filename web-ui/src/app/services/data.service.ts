import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { AggregateData, SearchResults } from '../models/index';

const filterDataSource = new BehaviorSubject<AggregateData>(undefined);
const searchResultsSource = new BehaviorSubject<SearchResults>(undefined);

@Injectable()
export class DataService {
    public filterData$ = filterDataSource.asObservable();
    public searchResults$ = searchResultsSource.asObservable();

    pushNewFilterData(data: AggregateData) {
        filterDataSource.next(data);
    }

    pushNewSearchResults(data: SearchResults) {
        searchResultsSource.next(data);
    }
}
