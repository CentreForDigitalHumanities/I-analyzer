import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { AggregateResult, SearchResults, SearchFilter } from '../models/index';

const filterDataSource = new BehaviorSubject<SearchFilter[]>(undefined);
const timelineDataSource = new BehaviorSubject<AggregateResult[]>(undefined);

@Injectable()
export class DataService {
    public filterData$ = filterDataSource.asObservable();
    public timelineData$ = timelineDataSource.asObservable();


    pushNewFilterData(data: SearchFilter[]) {
        filterDataSource.next(data);
    }

    pushCurrentTimelineData(data: AggregateResult[]){
        timelineDataSource.next(data);
    }
}
