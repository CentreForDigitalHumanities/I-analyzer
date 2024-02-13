import * as _ from 'lodash';
import { Observable, Subject, from, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { mockUserResponse } from './user';
import { TaskResult, TasksOutcome } from '../app/models';
import { LimitedResultsDownloadParameters } from '../app/models/search-results';

export const fakeNgramResult = {
    words: [
        {
            label: 'the test',
            data: [1, 2]
        }
    ],
    time_points: ['1900-1910', '1910-1920']
};

export class ApiServiceMock {
    public SessionExpiredSubject = new Subject();
    public SessionExpired = this.SessionExpiredSubject.asObservable();
    public stopPolling$: Subject<boolean> = new Subject<boolean>();

    constructor(public fakeResult: { [path: string]: any } = {}) {}

    public abortTasks(data: TaskResult) {
        return { success: true };
    }

    public get(path: string): Promise<any> {
        return Promise.resolve(this.fakeResult[path]);
    }

    public corpus() {
        // return this.get('corpus');
        return of(this.get('corpus'));
    }

    download(data: LimitedResultsDownloadParameters): Promise<any> {
        return Promise.resolve({});
    }

    public searchHistory() {
        return Promise.resolve([]);
    }

    public getWordcloudData() {
        return this.get('get_wordcloud_data');
    }

    public pollTasks(ids: string[], stopPolling$: Subject<void>): Observable<TasksOutcome> {
        const fakeResults = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'ngram-task-id': fakeNgramResult,
        };
        const response: TasksOutcome = {
            status: 'done',
            results: ids.map((id) => fakeResults[id])
        };
        return from([response, response]).pipe(takeUntil(stopPolling$));
    }

    public downloads() {
        return Promise.resolve([]);
    }

    public getUser() {
        return of(mockUserResponse);
    }

    public keyInfo() {
        return of({ username: 'Thomas', email: 'thomas@cromwell.com' });
    }

    public fieldCoverage() {
        return Promise.resolve({});
    }

    saveQuery() {
        return Promise.resolve();
    }

    requestMeQdia() {
        return Promise.resolve({});
    }

    userTags() {
        return of([]);
    }
}
