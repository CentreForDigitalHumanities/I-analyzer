import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { TimelineData, SearchFilter } from '../models/index';

const filterDataSource = new BehaviorSubject<SearchFilter[]>(undefined);
const timelineDataSource = new BehaviorSubject<TimelineData>(undefined);

@Injectable()
export class DataService {
    public filterData$ = filterDataSource.asObservable();
    public timelineData$ = timelineDataSource.asObservable();


    pushNewFilterData(data: SearchFilter[]) {
        filterDataSource.next(data);
    }

    pushCurrentTimelineData(data: TimelineData){
        timelineDataSource.next(data);
    }
}
