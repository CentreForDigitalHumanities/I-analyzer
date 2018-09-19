import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { AggregateDataTriggered } from '../models/index';

const searchDataSource = new BehaviorSubject<AggregateDataTriggered>(undefined);

@Injectable()
export class DataService {
    public searchData$ = searchDataSource.asObservable();

    pushNewSearchData(data: AggregateDataTriggered) {
        searchDataSource.next(data);
    }
}
