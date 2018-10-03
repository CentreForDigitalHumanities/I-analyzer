import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { AggregateData } from '../models/index';

const filterDataSource = new BehaviorSubject<AggregateData>(undefined);
const visualizationDataSource = new BehaviorSubject<AggregateData>(undefined);

@Injectable()
export class DataService {
    public filterData$ = filterDataSource.asObservable();
    public visualizationData$ = visualizationDataSource.asObservable();

    pushNewFilterData(data: AggregateData) {
        filterDataSource.next(data);
    }

    pushNewVisualizationData(data: AggregateData) {
        visualizationDataSource.next(data);
    }
}
