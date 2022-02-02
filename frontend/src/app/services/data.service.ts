import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { TimelineData, HistogramData } from '../models/index';

const barchartDataSource = new BehaviorSubject<TimelineData|HistogramData>(undefined);

/**
 * This service is used to communicate changes between components
 * which don't have a child-parent relationship
 * Currently used for pushing changes from timeline component
 * to frequency table component
 */
@Injectable()
export class DataService {
    public barchartData$ = barchartDataSource.asObservable();

    pushCurrentTimelineData(data: TimelineData) {
        barchartDataSource.next(data);
    }

    pushCurrentHistogramData(data: HistogramData) {
        barchartDataSource.next(data);
    }
}
