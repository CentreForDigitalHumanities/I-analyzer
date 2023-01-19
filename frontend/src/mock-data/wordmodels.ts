import { Subject, Observable } from 'rxjs';


export class WordmodelsServiceMock {
    public SessionExpiredSubject = new Subject();
    public SessionExpired = this.SessionExpiredSubject.asObservable();

    constructor(public fakeResult: { [path: string]: any } = {}) {
    }

    public abortTasks() {
        return {success: true};
    }

    public get(path: string): Promise<any> {
        return Promise.resolve(this.fakeResult[path]);
    }

    public getRelatedWords() {
        return this.get('get_wordcloud_data');
    }

    public wordModelsDocumentationRequest() {
        return Promise.resolve({documentation: 'Some interesting documentation'});
    }

}
