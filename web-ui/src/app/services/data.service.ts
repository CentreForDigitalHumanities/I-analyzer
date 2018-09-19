import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs';

import { AggregateData } from '../models/index';

const searchDataSource = new BehaviorSubject<AggregateData>(undefined);

@Injectable()
export class DataService {
    public searchData$ = searchDataSource.asObservable();

    pushNewSearchData(data: AggregateData) {
        searchDataSource.next(data);
    }
}
