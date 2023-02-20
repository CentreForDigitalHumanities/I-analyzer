import { Injectable } from '@angular/core';
import { ApiRetryService } from './api-retry.service';
import { QueryDb } from '../models/query';
import * as _ from 'lodash';

@Injectable()
export class QueryService {

    constructor(private apiRetryService: ApiRetryService) { }

    save(query: QueryDb): Promise<any> {
        return this.apiRetryService.requireLogin(api => api.saveQuery(query));
    }


    /**
     * Retrieve saved queries
     */

    retrieveQueries(): Promise<QueryDb[]> {
        return this.apiRetryService.requireLogin(api => api.searchHistory());
    }
}
