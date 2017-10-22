import { Injectable } from '@angular/core';
import { Http, Response, RequestMethod, RequestOptionsArgs } from '@angular/http';
import { Resource,  ResourceAction, ResourceMethodPromise } from 'ngx-resource';
import { Subject, Observable } from 'rxjs';

import { ConfigService } from './config.service';
import { SearchFilterData, UserRole } from '../models/index';

@Injectable()
export class ApiService extends Resource {
    // TODO: deal with expired sessions
    private sessionExpiredSubject = new Subject();
    private apiUrl: Promise<string> | null = null;
    public SessionExpired = this.sessionExpiredSubject.asObservable();
    
    constructor(private config: ConfigService, http: Http) { 
        super(http);
    } 
    
    $getUrl(methodOptions?: any): string | Promise<string> {
        let resPath = super.$getUrl();
        // TODO: if this is a promise??
        if (!this.apiUrl) {
            this.apiUrl = this.config.get().then(config => config.apiUrl);
        }

        return this.apiUrl.then(apiUrl => apiUrl + resPath);
    }
    
    @ResourceAction({
        method: RequestMethod.Get,
        path: '/check_session'
    })
    public checkSession: ResourceMethodPromise<{ username: string}, { success: boolean}>;

    @ResourceAction({
        method: RequestMethod.Get,
        path: '/corpus'
    })
    public corpus: ResourceMethodPromise<void, any>;

    @ResourceAction({
        method: RequestMethod.Post,
        path: '/login'
    })
    public login: ResourceMethodPromise<
        { username: string, password: string }, 
        { success: boolean, username: string, roles: UserRole[] }>;

    @ResourceAction({
        method: RequestMethod.Post,
        path: '/logout'
    })
    public logout: ResourceMethodPromise<void, { success: boolean }>;

    @ResourceAction({
        method: RequestMethod.Post,
        path: '/search'
    })
    public search: ResourceMethodPromise<{ corpusName: string, query: string, fields: string[], filters: SearchFilterData[], n: null, resultType: 'json'}, any>;
}
