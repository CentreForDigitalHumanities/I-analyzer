import * as _ from 'lodash';
import { Subject, of } from 'rxjs';
import { mockUserResponse } from './user';

const fakeNgramResult = {
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

    public abortTasks() {
        return { success: true };
    }

    public get(path: string): Promise<any> {
        return Promise.resolve(this.fakeResult[path]);
    }

    public corpus() {
        // return this.get('corpus');
        return of(this.get('corpus'));
    }

    public searchHistory() {
        return Promise.resolve([]);
    }

    public getWordcloudData() {
        return this.get('get_wordcloud_data');
    }

    public pollTasks(ids: string[]) {
        const fakeResults = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'ngram-task-id': fakeNgramResult,
        };
        const response = ids.map((id) => _.get(fakeResults, id, {}));
        return of(response);
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
