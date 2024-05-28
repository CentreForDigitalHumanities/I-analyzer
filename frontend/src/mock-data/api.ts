import * as _ from 'lodash';
import { Observable, Subject, from, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { mockUserResponse } from './user';
import { Corpus, CorpusDocumentationPage, TaskResult, TasksOutcome } from '../app/models';
import { LimitedResultsDownloadParameters } from '../app/models/search-results';
import { mockCorpusDefinition } from './corpus-definition';
import { APIEditableCorpus } from '../app/models/corpus-definition';

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

    public corpusDocumentationPage(corpus: Corpus): Observable<CorpusDocumentationPage[]> {
        return of([{
            id: 1,
            corpus: corpus.name,
            type: 'General',
            content: 'Example of _documentation_.',
            index: 1,
        }]);
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

    corpusDefinitions(): Observable<APIEditableCorpus[]> {
        const data = [{ id: 1, active: false, definition: mockCorpusDefinition }];
        return of(data);
    }

    corpusDefinition(id: number): Observable<APIEditableCorpus> {
        const data = { id, active: false, definition: mockCorpusDefinition };
        return of(data);
    }

    createCorpus(data: APIEditableCorpus): Observable<APIEditableCorpus> {
        const result = _.merge({ id: 1 }, data);
        return of(result);
    }

    updateCorpus(_id: number, data: APIEditableCorpus): Observable<APIEditableCorpus> {
        return of(data);
    }
}
