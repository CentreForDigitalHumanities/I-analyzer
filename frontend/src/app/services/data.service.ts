import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { TimelineData, SearchFilter, SearchFilterData } from '../models/index';

const filterDataSource = new BehaviorSubject<SearchFilter<SearchFilterData>[]>(undefined);
const timelineDataSource = new BehaviorSubject<TimelineData>(undefined);

@Injectable()
export class DataService {
    public filterData$ = filterDataSource.asObservable();
    public timelineData$ = timelineDataSource.asObservable();


    pushNewFilterData(data: SearchFilter<SearchFilterData>[]) {
        filterDataSource.next(data);
    }

    pushCurrentTimelineData(data: TimelineData){
        timelineDataSource.next(data);
    }
}
