import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Query } from '../models/query';

@Injectable()
export class QueryService {

    constructor(private apiService: ApiService) { }

    async save(query: Query): Promise<Query> {
        let queryDb = {
            query: query.query,
            corpus_name: query.corpusName,
            started: query.started,
            completed: query.completed,
            aborted: query.aborted,
            userID: query.userId,
            transferred: query.transferred
        };

        let setQueryId: number | undefined;

        if (query.id instanceof Promise) {
            // It might be that another operation is already busy assigning an ID to this query object
            // wait for that to prevent a race condition.
            setQueryId = await query.id;
        } else if (query.id != undefined) {
            setQueryId = query.id;
        }

        let response = await (setQueryId != undefined
            ? this.apiService.query(Object.assign({ id: setQueryId }, queryDb))
            : this.setQueryIdPromise(this.apiService.query(queryDb), query));

        return {
            id: response.id,
            query: response.query,
            corpusName: response.corpus_name,
            started: response.started,
            completed: response.completed,
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
}
