import { ApiService } from './api.service';
import { Subject, Observable } from 'rxjs';
import 'rxjs/add/operator/toPromise';

export class ApiServiceMock {
    public SessionExpiredSubject = new Subject();
    public SessionExpired = this.SessionExpiredSubject.asObservable();

    constructor(public fakeResult: { [path: string]: any } = {}) {
    }

    public get(path: string): Promise<any> {
        return Promise.resolve(this.fakeResult[path]);
    }

    public corpus() {
        return this.get('corpus');
    }

    public search_history() {
        return this.get('search_history');
    };

    public getWordcloudData(){
        return this.get('get_wordcloud_data');
    }
}
