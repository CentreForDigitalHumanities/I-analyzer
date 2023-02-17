import { Injectable } from '@angular/core';
import { ApiRetryService } from './api-retry.service';
import { Query } from '../models/query';
import { AuthService } from './auth.service';

@Injectable()
export class QueryService {

    constructor(private apiRetryService: ApiRetryService, private authService: AuthService) { }

    async save(query: Query): Promise<any> {
        const queryCommand = {
            user: this.authService.getCurrentUser().id,
            query_json: query.query,
            corpus: query.corpusName,
            started: query.started,
            completed: query.completed,
            aborted: query.aborted,
            transferred: query.transferred,
            total_results: query.totalResults.value,
        };

        return this.apiRetryService.requireLogin(api => api.saveQuery(queryCommand));
    }


    /**
     * Retrieve saved queries
     */

    async retrieveQueries(): Promise<Query[]> {
        const response = await this.apiRetryService.requireLogin(api => api.search_history());
        return response.queries;
    }
}
