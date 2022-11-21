import { Injectable } from '@angular/core';
import { Resource, ResourceAction, ResourceParams,
    ResourceRequestMethod, ResourceHandler, ResourceResponseBodyType, IResourceAction, IResourceMethod, IResourceMethodFull } from '@ngx-resource/core';

import { environment } from '../../environments/environment';
import { EsQuery, EsQuerySorted } from './elastic-search.service';
import { ImageInfo } from '../image-view/image-view.component';
import { AccessibleCorpus, AggregateResult, RelatedWordsResults, NgramResults, UserRole, Query, QueryModel, Corpus, FoundDocument, TaskResult, DateResult, WordcloudParameters, DateTermFrequencyParameters, AggregateTermFrequencyParameters, TermFrequencyResult, Download, ResultsDownloadParameters, LimitedResultsDownloadParameters } from '../models/index';
import { timer } from 'rxjs';
import {
    catchError,
    concatMap,
    filter,
    switchMap,
    take,
    tap,
} from 'rxjs/operators';

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
    transferred: number,
    total_results: {
        value: number,
        relation: string
    }
};

@Injectable()
@ResourceParams()
export class ApiService extends Resource {
    private apiUrl: string;

    constructor(restHandler: ResourceHandler) {
        super(restHandler);
    }

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/check_session'
    })
    public checkSession: ResourceMethod<{ username: string }, { success: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/wordcloud'
    })
    public wordcloud: ResourceMethod<
    WordcloudParameters,
        { success: false, message: string } | { success: true, data: AggregateResult[] }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/wordcloud_tasks'
    })
    public wordcloudTasks: ResourceMethod<
        WordcloudParameters,
        { success: false, message: string } | { success: true, task_ids: string[] }>;


    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/task_status'
    })
    public getTasksStatus: ResourceMethod<
    { task_ids: string[]},
    { success: false, message: string } | { success: true, done: false } |
    { success: true, done: true, results: any }
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/abort_tasks/'
    })
    public abortTasks: ResourceMethod<
    { task_ids: string[] },
    { success: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/ngram_tasks'
    })
    public ngramTasks: ResourceMethod<
        { es_query: EsQuery, corpus_name: string, field: string, ngram_size?: number, term_position?: string, freq_compensation?: boolean,
            subfield?: string, max_size_per_interval?: number, number_of_ngrams?: number, date_field: string, },
        { success: false, message: string } | { success: true, task_ids: string[] }>;


    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/aggregate_term_frequency'
    })
    public getAggregateTermFrequency: ResourceMethod<
        AggregateTermFrequencyParameters,
        TaskResult>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/date_term_frequency'
    })
    public getDateTermFrequency: ResourceMethod<
        DateTermFrequencyParameters,
        TaskResult>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/request_full_data'
    })
    public requestFullData: ResourceMethod<
        { visualization: 'date_term_frequency', parameters: DateTermFrequencyParameters[], corpus: string, } |
        { visualization: 'aggregate_term_frequency', parameters: AggregateTermFrequencyParameters[], corpus: string, },
        TaskResult>;

    @ResourceAction({
        path: '/corpus'
    })
    public corpus: ResourceMethod<void, any>;

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
        { success: boolean, id: number, username: string, corpora: AccessibleCorpus[], downloadLimit: number | null }>;

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
        path: '/download',
        responseBodyType: ResourceResponseBodyType.Blob,
        asResourceResponse: true
    })
    public download: ResourceMethod<
        LimitedResultsDownloadParameters,
        { success: false, message: string } | any >;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/download_task'
    })
    public downloadTask: ResourceMethod<
        ResultsDownloadParameters,
        { success: false, message: string } | { success: true, task_ids: string[] } | any >;


    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/register'
    })
    public register: ResourceMethod<
        { username: string, email: string, password: string },
        { success: boolean, is_valid_username: boolean, is_valid_email: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/request_reset'
    })
    public requestReset: ResourceMethod<
        { email: string },
        { success: boolean, message: string }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/reset_password'
    })
    public resetPassword: ResourceMethod<
        { password: string, token: string },
        { success: boolean, message?: string, username?: string }
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/solislogin'
    })
    public solisLogin: IResourceMethod<
    { },
    { success: boolean, id: number, username: string, role: UserRole, downloadLimit: number | null, queries: Query[] }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/ensure_csrf'
    })
    public ensureCsrf: ResourceMethod<void, { success: boolean }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/search_history'
    })
    public search_history: ResourceMethod<void, { 'queries': Query[] }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/downloads'
    })
    public downloads: ResourceMethod<void, Download[]>;


    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/get_media{!args}',
        responseBodyType: ResourceResponseBodyType.ArrayBuffer,
        asResourceResponse: true
    })
    public getMedia: IResourceMethodFull<
        {args: string},
        any>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/request_media'
    })
    public requestMedia: ResourceMethod<
        { corpus_index: string, document: FoundDocument },
        { success: false } | { success: true, media: string[], info?: ImageInfo }
        >;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/download_pdf/{corpus_index}/{filepath}',
    })
    public downloadPdf: IResourceMethod<{ corpus_index: string, filepath: string }, any>

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/corpusdescription/{corpus}/{filename}',
        responseBodyType: ResourceResponseBodyType.Text
    })
    public corpusdescription: ResourceMethod<{ filename: string, corpus: string }, any>;

    $getUrl(actionOptions: IResourceAction): string | Promise<string> {
        const urlPromise = super.$getUrl(actionOptions);
        if (!this.apiUrl) {
            this.apiUrl = environment.apiUrl;
        }

        return Promise.all([this.apiUrl, urlPromise]).then(([apiUrl, url]) => `${apiUrl}${url}`);
    }

    private tasksDone<ExpectedResult>(response: { success: false, message: string } | { success: true, done: false } |
        { success: true, done: true, results: ExpectedResult[] }) {
        return response.success === false || response.done === true;
    }

    public pollTasks<ExpectedResult>(ids: string[]): Promise<{ success: false, message: string } | { success: true, done: false } |
    { success: true, done: true, results: ExpectedResult[] }> {
        return timer(0, 5000).pipe(
            switchMap((_) => this.getTasksStatus({'task_ids': ids})),
            filter(this.tasksDone),
            take(1)
        ).toPromise();
    }
}
