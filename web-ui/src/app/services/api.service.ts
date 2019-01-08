import { Injectable } from '@angular/core';
import { Http, Response, RequestMethod, RequestOptionsArgs } from '@angular/http';
import { Rest, RestAction, RestParams, RestRequestMethod, RestHandler, IRestAction, IRestMethod } from 'rest-core';
import { Subject, Observable } from 'rxjs';

import { ConfigService } from './config.service';
import { EsQuery, EsQuerySorted } from './elastic-search.service';
import { SearchFilterData, AggregateResult, RelatedWordsResults, UserRole, Query, User, Corpus } from '../models/index';

// workaround for https://github.com/angular/angular-cli/issues/2034
type RestMethod<IB, O> = IRestMethod<IB, O>;

/**
 * Describes the values as expected and returned by the server.
 */
type QueryDb<TDateType> = {
    query: string,
    corpus_name: string,
    started?: TDateType,
    completed?: TDateType,
    aborted: boolean,
    transferred: number
}

@Injectable()
@RestParams()
export class ApiService extends Rest {
    private apiUrl: Promise<string> | null = null;

    constructor(private config: ConfigService, restHandler: RestHandler) {
        super(restHandler);
    }

    $getUrl(actionOptions: IRestAction): string | Promise<string> {
        let urlPromise = super.$getUrl(actionOptions);
        if (!this.apiUrl) {
            this.apiUrl = this.config.get().then(config => config.apiUrl);
        }

        return Promise.all([this.apiUrl, urlPromise]).then(([apiUrl, url]) => `${apiUrl}${url}`);
    }

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/check_session'
    })
    public checkSession: RestMethod<{ username: string }, { success: boolean }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/get_wordcloud_data'
    })
    public getWordcloudData: RestMethod<
        { content_list: string[] },
        { data: AggregateResult[] }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/get_related_words'
    })
    public getRelatedWords: RestMethod<
        { query_term: string, corpus_name: string },
        { success: boolean, message?: string, related_word_data?: RelatedWordsResults }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/get_related_words_time_interval'
    })
    public getRelatedWordsTimeInterval: RestMethod<
        { query_term: string, corpus_name: string, time: string },
        { success: boolean, message?: string, related_word_data?: RelatedWordsResults }>;

    @RestAction({
        path: '/corpus'
    })
    public corpus: RestMethod<void, any>;

    @RestAction({
        method: RestRequestMethod.Get,
        path: '/es_config'
    })
    public esConfig: RestMethod<void, [{
        'name': string,
        'host': string,
        'port': number,
        'chunkSize': number,
        'maxChunkBytes': number,
        'bulkTimeout': string,
        'overviewQuerySize': number,
        'scrollTimeout': string,
        'scrollPagesize': number
    }]>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/log'
    })
    public log: RestMethod<
        { msg: string, type: 'info' | 'error' },
        { success: boolean }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/login'
    })
    public login: RestMethod<
        { username: string, password: string },
        { success: boolean, id: number, username: string, role: UserRole, downloadLimit: number | null, queries: Query[] }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/logout'
    })
    public logout: RestMethod<void, { success: boolean }>;

    @RestAction({
        method: RestRequestMethod.Put,
        path: '/query'
    })
    public query: RestMethod<QueryDb<Date> & {
        id?: number,
        /**
         * Mark the query as started, and use the server time for determining this timestamp.
         */
        markStarted: boolean,
        /**
         * Mark the query as completed, and use the server time for determining this timestamp.
         */
        markCompleted: boolean,
    }, QueryDb<string> & {
        id: number,
        userID: number
    }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path:'/download'
    })
    public download: RestMethod<
    { corpus: Corpus, esQuery: EsQuery | EsQuerySorted, size: number },
    { success: boolean } >;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/register'
    })
    public register: RestMethod<
        { username: string, email: string, password: string },
        { success: boolean, is_valid_username: boolean, is_valid_email: boolean }>;

    @RestAction({
        method: RestRequestMethod.Get,
        path: '/search_history'
    })
    public search_history: RestMethod<void, { 'queries': Query[] }>;
}
