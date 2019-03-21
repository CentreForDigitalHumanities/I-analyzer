import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { DateFrequencyPair, SearchFilter } from '../models/index';

const filterDataSource = new BehaviorSubject<SearchFilter[]>(undefined);
const timelineDataSource = new BehaviorSubject<DateFrequencyPair[]>(undefined);

@Injectable()
export class DataService {
    public filterData$ = filterDataSource.asObservable();
    public timelineData$ = timelineDataSource.asObservable();


    pushNewFilterData(data: SearchFilter[]) {
        filterDataSource.next(data);
    }

    pushCurrentTimelineData(data: DateFrequencyPair[]){
        timelineDataSource.next(data);
    }
}
