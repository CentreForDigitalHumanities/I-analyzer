import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs';

import { AggregateData } from '../models/index';


@Injectable()
export class DataService {
    private searchDataSource = new Subject<AggregateData>();

    public searchData$ = this.searchDataSource.asObservable();

    pushNewSearchData(data: AggregateData) {
        this.searchDataSource.next(data);
        console.log(this.searchDataSource, data);
    }
}
