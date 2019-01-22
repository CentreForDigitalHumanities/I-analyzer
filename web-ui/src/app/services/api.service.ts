import { Injectable } from '@angular/core';
import { Resource, ResourceAction, ResourceParams, ResourceRequestMethod, ResourceHandler, ResourceResponseBodyType, IResourceAction, IResourceMethod } from '@ngx-resource/core';

import { ConfigService } from './config.service';
import { EsQuery, EsQuerySorted } from './elastic-search.service';
//import { SearchFilterData, AggregateResult, RelatedWordsResults, UserRole, Query, User, Corpus } from '../models/index';
import { AggregateResult, RelatedWordsResults, UserRole, Query, Corpus } from '../models/index';

// workaround for https://github.com/angular/angular-cli/issues/2034
type ResourceMethod<IB, O> = IResourceMethod<IB, O>;

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
@ResourceParams()
export class ApiService extends Resource {
    private apiUrl: Promise<string> | null = null;

    constructor(private config: ConfigService, restHandler: ResourceHandler) {
        super(restHandler);
    }

    $getUrl(actionOptions: IResourceAction): string | Promise<string> {
        let urlPromise = super.$getUrl(actionOptions);
        if (!this.apiUrl) {
            this.apiUrl = this.config.get().then(config => config.apiUrl);
        }

        return Promise.all([this.apiUrl, urlPromise]).then(([apiUrl, url]) => `${apiUrl}${url}`);
    }

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/check_session'
    })
    public checkSession: ResourceMethod<{ username: string }, { success: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/get_wordcloud_data'
    })
    public getWordcloudData: ResourceMethod<
        { content_list: string[] },
        { data: AggregateResult[] }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/get_related_words'
    })
    public getRelatedWords: ResourceMethod<
        { query_term: string, corpus_name: string },
        { success: boolean, message?: string, related_word_data?: RelatedWordsResults }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/get_related_words_time_interval'
    })
    public getRelatedWordsTimeInterval: ResourceMethod<
        { query_term: string, corpus_name: string, time: string },
        { success: boolean, message?: string, related_word_data?: RelatedWordsResults }>;

    @ResourceAction({
        path: '/corpus'
    })
    public corpus: ResourceMethod<void, any>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/es_config'
    })
    public esConfig: ResourceMethod<void, [{
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

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/log'
    })
    public log: ResourceMethod<
        { msg: string, type: 'info' | 'error' },
        { success: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/login'
    })
    public login: ResourceMethod<
        { username: string, password: string },
        { success: boolean, id: number, username: string, role: UserRole, downloadLimit: number | null, queries: Query[] }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/logout'
    })
    public logout: ResourceMethod<void, { success: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Put,
        path: '/query'
    })
    public query: ResourceMethod<QueryDb<Date> & {
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

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/download'
    })
    public download: ResourceMethod<
        { corpus: Corpus, esQuery: EsQuery | EsQuerySorted, size: number },
        { success: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/register'
    })
    public register: ResourceMethod<
        { username: string, email: string, password: string },
        { success: boolean, is_valid_username: boolean, is_valid_email: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/search_history'
    })
    public search_history: ResourceMethod<void, { 'queries': Query[] }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/corpusdescription/{filename}',
        responseBodyType: ResourceResponseBodyType.Text
    })
    public corpusdescription: ResourceMethod<{ filename: string }, any>;
}