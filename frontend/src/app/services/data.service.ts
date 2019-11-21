import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { TimelineData } from '../models/index';

const timelineDataSource = new BehaviorSubject<TimelineData>(undefined);

/**
 * This service is used to communicate changes between components
 * which don't have a child-parent relationship
 * Currently used for pushing changes from timeline component
 * to frequency table component
 */
@Injectable()
export class DataService {
    public timelineData$ = timelineDataSource.asObservable();

    pushCurrentTimelineData(data: TimelineData){
        timelineDataSource.next(data);
    }
}
