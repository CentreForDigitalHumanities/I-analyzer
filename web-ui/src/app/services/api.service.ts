import { Injectable } from '@angular/core';
import { Http, Response, RequestMethod, RequestOptionsArgs } from '@angular/http';
import { Rest, RestAction, RestParams, RestRequestMethod, RestHandler, IRestAction, IRestMethod } from 'rest-core';
import { Subject, Observable } from 'rxjs';

import { ConfigService } from './config.service';
import { SessionService } from './session.service';
import { SearchFilterData, UserRole } from '../models/index';

// workaround for https://github.com/angular/angular-cli/issues/2034
type RestMethod<IB, O> = IRestMethod<IB, O>;

@Injectable()
@RestParams()
export class ApiService extends Rest {
    private apiUrl: Promise<string> | null = null;

    constructor(private config: ConfigService, private sessionService: SessionService, restHandler: RestHandler) {
        super(restHandler);
    }

    $getUrl(actionOptions: IRestAction): string | Promise<string> {
        let urlPromise = super.$getUrl(actionOptions);
        if (!this.apiUrl) {
            this.apiUrl = this.config.get().then(config => config.apiUrl);
        }

        return Promise.all([this.apiUrl, urlPromise]).then(([apiUrl, url]) => `${apiUrl}${url}`);
    }

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/check_session'
    })
    public checkSession: RestMethod<{ username: string }, { success: boolean }>;

    @RestAction({
        path: '/corpus'
    })
    public corpus: RestMethod<void, any>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/login'
    })
    public login: RestMethod<
    { username: string, password: string },
    { success: boolean, username: string, roles: UserRole[] }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/logout'
    })
    public logout: RestMethod<void, { success: boolean }>;

    @RestAction({
        method: RestRequestMethod.Post,
        path: '/search'
    })
    public search: RestMethod<{ corpusName: string, query: string, fields: string[], filters: SearchFilterData[], n: null, resultType: 'json' }, any>;

    public getSearchCsvUrl(): Promise<string> {
        return Promise.resolve().then(() => this.$getUrl({ path: '/search//csv' }));
    }
}
