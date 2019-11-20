import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable }    from 'rxjs';

import { TimelineData } from '../models/index';

const timelineDataSource = new BehaviorSubject<TimelineData>(undefined);

@Injectable()
export class DataService {
    public timelineData$ = timelineDataSource.asObservable();

    pushCurrentTimelineData(data: TimelineData){
        timelineDataSource.next(data);
    }
}
