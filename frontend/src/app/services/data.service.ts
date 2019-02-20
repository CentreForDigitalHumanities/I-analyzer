import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { AggregateData, AggregateResult, SearchResults, SearchFilter } from '../models/index';

const filterDataSource = new BehaviorSubject<SearchFilter[]>(undefined);
const aggregateDataSource = new BehaviorSubject<AggregateData>(undefined);
const searchResultsSource = new BehaviorSubject<SearchResults>(undefined);
const timelineDataSource = new BehaviorSubject<AggregateResult[]>(undefined);

@Injectable()
export class DataService {
    public filterData$ = filterDataSource.asObservable();
    public aggregateData$ = aggregateDataSource.asObservable();
    public searchResults$ = searchResultsSource.asObservable();
    public timelineData$ = timelineDataSource.asObservable();

    pushNewAggregateData(data: AggregateData) {
        aggregateDataSource.next(data);
    }

    pushNewFilterData(data: SearchFilter[]) {
        filterDataSource.next(data);
    }

    pushNewSearchResults(data: SearchResults) {
        searchResultsSource.next(data);
    }

    pushCurrentTimelineData(data: AggregateResult[]){
        timelineDataSource.next(data);
    }
}
