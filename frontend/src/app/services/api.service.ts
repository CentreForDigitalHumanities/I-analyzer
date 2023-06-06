/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import {
    IResourceAction,
    IResourceMethod,
    IResourceMethodFull,
    Resource,
    ResourceAction,
    ResourceHandler,
    ResourceParams,
    ResourceRequestMethod,
    ResourceResponseBodyType,
} from '@ngx-resource/core';

import { HttpClient } from '@angular/common/http';
import { timer } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ImageInfo } from '../image-view/image-view.component';
import {
    AggregateResult,
    AggregateTermFrequencyParameters,
    Corpus,
    DateTermFrequencyParameters,
    Download,
    DownloadOptions,
    FieldCoverage,
    FoundDocument,
    LimitedResultsDownloadParameters,
    QueryDb,
    QueryModel,
    ResultsDownloadParameters,
    TaskResult,
    TasksOutcome,
    UserResponse,
    UserRole,
    WordcloudParameters,
} from '../models/index';
import { EsQuery } from './elastic-search.service';

// workaround for https://github.com/angular/angular-cli/issues/2034
type ResourceMethod<IB, O> = IResourceMethod<IB, O>;

@Injectable()
@ResourceParams()
export class ApiService extends Resource {
    private apiUrl: string;
    private authApiUrl = 'users';
    private authApiRoute = (route: string): string =>
        `/${this.authApiUrl}/${route}/`;

    constructor(restHandler: ResourceHandler, private http: HttpClient) {
        super(restHandler);
    }

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/check_session',
    })
    public checkSession: ResourceMethod<
        { username: string },
        { success: boolean }
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/visualization/wordcloud',
    })
    public wordcloud: ResourceMethod<WordcloudParameters, AggregateResult[]>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: 'visualization/wordcloud_task',
    })
    public wordcloudTasks: ResourceMethod<WordcloudParameters, TaskResult>;

    public getTasksStatus<ExpectedResult>(
        tasks: TaskResult
    ): Promise<TasksOutcome<ExpectedResult>> {
        return this.http
            .post<TasksOutcome<ExpectedResult>>('/api/task_status', tasks)
            .toPromise();
    }

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/abort_tasks',
    })
    public abortTasks: ResourceMethod<TaskResult, { success: true }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/visualization/ngram',
    })
    public ngramTasks: ResourceMethod<
        {
            es_query: EsQuery;
            corpus_name: string;
            field: string;
            ngram_size?: number;
            term_position?: string;
            freq_compensation?: boolean;
            subfield?: string;
            max_size_per_interval?: number;
            number_of_ngrams?: number;
            date_field: string;
        },
        TaskResult
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/visualization/aggregate_term_frequency',
    })
    public getAggregateTermFrequency: ResourceMethod<
        AggregateTermFrequencyParameters,
        TaskResult
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/visualization/date_term_frequency',
    })
    public getDateTermFrequency: ResourceMethod<
        DateTermFrequencyParameters,
        TaskResult
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/download/full_data',
    })
    public requestFullData: ResourceMethod<
        | {
              visualization: 'date_term_frequency';
              parameters: DateTermFrequencyParameters[];
              corpus: string;
          }
        | {
              visualization: 'aggregate_term_frequency';
              parameters: AggregateTermFrequencyParameters[];
              corpus: string;
          },
        TaskResult
    >;

    public saveQuery(options: QueryDb) {
        return this.http.post('/api/search_history/', options).toPromise();
    }

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/download/search_results',
        responseBodyType: ResourceResponseBodyType.Blob,
        asResourceResponse: true,
    })
    public download: ResourceMethod<LimitedResultsDownloadParameters, any>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/download/csv/{id}',
        responseBodyType: ResourceResponseBodyType.Blob,
        asResourceResponse: true,
    })
    public csv: ResourceMethod<
        { id: number } | ({ id: number } & DownloadOptions),
        any
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/download/search_results_task',
    })
    public downloadTask: ResourceMethod<ResultsDownloadParameters, TaskResult>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/solislogin',
    })
    public solisLogin: IResourceMethod<
        any,
        {
            success: boolean;
            id: number;
            username: string;
            role: UserRole;
            downloadLimit: number | null;
            queries: QueryDb[];
        }
    >;

    public searchHistory() {
        return this.http.get<QueryDb[]>('/api/search_history/').toPromise();
    }

    public downloads(): Promise<Download[]> {
        return this.http.get<Download[]>('/api/download/').toPromise();
    }

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/get_media{!args}',
        responseBodyType: ResourceResponseBodyType.ArrayBuffer,
        asResourceResponse: true,
    })
    public getMedia: IResourceMethodFull<{ args: string }, any>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/request_media',
    })
    public requestMedia: ResourceMethod<
        { corpus: string; document: FoundDocument },
        { media: string[]; info?: ImageInfo }
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/download_pdf/{corpus_index}/{filepath}',
    })
    public downloadPdf: IResourceMethod<
        { corpus_index: string; filepath: string },
        any
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/corpus/documentation/{corpus}/{filename}',
        responseBodyType: ResourceResponseBodyType.Text,
    })
    public corpusdescription: ResourceMethod<
        { filename: string; corpus: string },
        string
    >;

    fieldCoverage(corpusName: string): Promise<FieldCoverage> {
        return this.http.get<FieldCoverage>(
            `/api/visualization/coverage/${corpusName}`,
        ).toPromise();
    }

    $getUrl(actionOptions: IResourceAction): string | Promise<string> {
        const urlPromise = super.$getUrl(actionOptions);
        if (!this.apiUrl) {
            this.apiUrl = environment.apiUrl;
        }

        return Promise.all([this.apiUrl, urlPromise]).then(
            ([apiUrl, url]) => `${apiUrl}${url}`
        );
    }

    private tasksDone<ExpectedResult>(response: TasksOutcome<ExpectedResult>) {
        return response.status !== 'working';
    }

    public pollTasks<ExpectedResult>(ids: string[]): Promise<ExpectedResult[]> {
        return timer(0, 5000)
            .pipe(
                switchMap((_) =>
                    this.getTasksStatus<ExpectedResult>({ task_ids: ids })
                ),
                filter(this.tasksDone),
                take(1)
                // eslint-disable-next-line @typescript-eslint/no-shadow
            )
            .toPromise()
            .then(
                (result) =>
                    new Promise((resolve, reject) =>
                        result.status === 'done'
                            ? resolve(result.results)
                            : reject()
                    )
            );
    }

    public corpus() {
        return this.http.get<Corpus[]>('/api/corpus/');
    }

    // Authentication API
    public login(username: string, password: string) {
        return this.http.post<{ key: string }>(this.authApiRoute('login'), {
            username,
            password,
        });
    }

    public logout() {
        return this.http.post<{ detail: string }>(
            this.authApiRoute('logout'),
            {}
        );
    }

    public getUser() {
        return this.http.get<UserResponse>(this.authApiRoute('user'));
    }

    public register(details: {
        username: string;
        email: string;
        password1: string;
        password2: string;
    }) {
        return this.http.post<any>(this.authApiRoute('registration'), details);
    }

    public verify(key: string) {
        return this.http.post<any>(
            this.authApiRoute('registration/verify-email'),
            { key }
        );
    }

    public keyInfo(key: string) {
        return this.http.post<{ username: string; email: string }>(
            this.authApiRoute('registration/key-info'),
            { key }
        );
    }

    public requestResetPassword(email: string) {
        return this.http.post<{ detail: string }>(
            this.authApiRoute('password/reset'),
            { email }
        );
    }

    public resetPassword(
        uid: string,
        token: string,
        newPassword1: string,
        newPassword2: string
    ) {
        return this.http.post<{ detail: string }>(
            this.authApiRoute('password/reset/confirm'),
            {
                uid,
                token,
                new_password1: newPassword1,
                new_password2: newPassword2,
            }
        );
    }
}
