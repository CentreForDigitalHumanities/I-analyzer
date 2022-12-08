import { Subject, Observable } from 'rxjs';


export class ApiServiceMock {
    public SessionExpiredSubject = new Subject();
    public SessionExpired = this.SessionExpiredSubject.asObservable();

    constructor(public fakeResult: { [path: string]: any } = {}) {
    }

    public abortTasks() {
        return {'success': true};
    }

    public get(path: string): Promise<any> {
        return Promise.resolve(this.fakeResult[path]);
    }

    public corpus() {
        return this.get('corpus');
    }

    public ensureCsrf(): Promise<any> {
        return Promise.resolve({'success': true});
    }

    public search_history() {
        return Promise.resolve({'queries': []});
    }

    public getWordcloudData() {
        return this.get('get_wordcloud_data');
    }

    public pollTasks() {
        return Promise.resolve([{}]);
    }

    public downloads() {
        return Promise.resolve([]);
    }
}
