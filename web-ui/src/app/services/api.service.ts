import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Subject, Observable } from 'rxjs';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ApiService {
    private sessionExpiredSubject = new Subject();
    public SessionExpired = this.sessionExpiredSubject.asObservable();

    constructor(private config: ConfigService, private http: Http) { }

    public get<T>(path: string, options?: RequestOptionsArgs): Promise<T> {
        return this.requestPath(path, HttpMethod.Get, undefined, options);
    }

    public delete<T>(path: string, options?: RequestOptionsArgs): Promise<T> {
        return this.requestPath(path, HttpMethod.Delete, undefined, options);
    }

    public head<T>(path: string, options?: RequestOptionsArgs): Promise<T> {
        return this.requestPath(path, HttpMethod.Head, undefined, options);
    }

    public options<T>(path: string, options?: RequestOptionsArgs): Promise<T> {
        return this.requestPath(path, HttpMethod.Options, undefined, options);
    }

    public post<T>(path: string, body?: any, options?: RequestOptionsArgs): Promise<T> {
        return this.requestPath(path, HttpMethod.Post, body, options);
    }

    public put<T>(path: string, body?: any, options?: RequestOptionsArgs): Promise<T> {
        return this.requestPath(path, HttpMethod.Put, body, options);
    }

    public patch<T>(path: string, body?: any, options?: RequestOptionsArgs): Promise<T> {
        return this.requestPath(path, HttpMethod.Patch, body, options);
    }

    public resolveUrl(path: string): Promise<string> {
        return this.config.get().then(config => `${config.apiUrl}/${path}`);
    }

    private requestPath<T>(path: string, method: HttpMethod, body?: any, options?: RequestOptionsArgs) {
        return this.resolveUrl(path)
            .then(url => this.requestUrl(url, method, body, options).toPromise())
            .then(response => response.ok
                ? Promise.resolve<T>(response.json())
                : Promise.reject(`${response.status}: ${response.statusText}`))
            .catch((error) => {
                if (error instanceof Response && error.status == 401) {
                    this.sessionExpiredSubject.next();
                }
                throw error;
            });
    }

    private requestUrl(url: string, method: HttpMethod, body?: any, options?: RequestOptionsArgs): Observable<Response> {
        switch (method) {
            case HttpMethod.Get:
            case HttpMethod.Delete:
            case HttpMethod.Head:
            case HttpMethod.Options:
                return this.http[method](url, options);
            case HttpMethod.Post:
            case HttpMethod.Put:
            case HttpMethod.Patch:
                return this.http[method](url, body, options);
        }
    }
}

enum HttpMethod {
    Get = 'get',
    Post = 'post',
    Put = 'put',
    Delete = 'delete',
    Patch = 'patch',
    Head = 'head',
    Options = 'options'
}
