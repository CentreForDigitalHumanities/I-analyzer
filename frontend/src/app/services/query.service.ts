import { Injectable } from '@angular/core';
import { ApiRetryService } from './api-retry.service';
import { Query } from '../models/query';

@Injectable()
export class QueryService {

    constructor(private apiRetryService: ApiRetryService) { }

    async save(query: Query, started = false, completed = false): Promise<Query> {
        const queryCommand = {
            id: query.id,
            query: query.query,
            corpus_name: query.corpusName,
            markStarted: started,
            markCompleted: completed,
            started: query.started,
            completed: query.completed,
            aborted: query.aborted,
            transferred: query.transferred,
            total_results: query.totalResults
        };

        const response = await this.apiRetryService.requireLogin(api => api.query(queryCommand));

        return {
            id: response.id,
            query: response.query,
            corpusName: response.corpus_name,
            started: response.started ? new Date(response.started) : undefined,
            completed: response.completed ? new Date(response.completed) : undefined,
            aborted: response.aborted,
            userId: response.userID,
            transferred: response.transferred,
            totalResults: response.total_results
        };
    }

    /**
     * Make other operations on this query wait for it to have received an id.
     * @param promise Returns a model with the id to assign.
     * @param query The query for which an id is to be promised.
     */
    setQueryIdPromise<T>(promise: Promise<(T & { id: number })>, query: { id?: number | Promise<number> }): Promise<(T & { id: number })> {
        query.id = new Promise((resolve) => promise.then(value => resolve(value.id)));
        return promise;
    }


    /**
    * Retrieve saved queries
    */

    async retrieveQueries(): Promise<Query[]> {
        const response = await this.apiRetryService.requireLogin(api => api.search_history());
        return response.queries;
    }
}
