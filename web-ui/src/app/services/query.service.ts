import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Query } from '../models/query';

@Injectable()
export class QueryService {

    constructor(private apiService: ApiService) { }

    async save(query: Query, started = false, completed = false): Promise<Query> {
        let queryCommand = {
            id: query.id,
            query: query.query,
            corpus_name: query.corpusName,
            markStarted: started,
            markCompleted: completed,
            started: query.started,
            completed: query.completed,
            aborted: query.aborted,
            transferred: query.transferred
        };

        let response = await this.apiService.query(queryCommand);

        return {
            id: response.id,
            query: response.query,
            corpusName: response.corpus_name,
            started: response.started ? new Date(response.started) : undefined,
            completed: response.completed ? new Date(response.completed) : undefined,
            aborted: response.aborted,
            userId: response.userID,
            transferred: response.transferred
        }
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
        let response = await this.apiService.search_history();
        return response.queries;
    }
}
