import { Injectable } from '@angular/core';
import { Response } from '@angular/http';

import { ApiService } from './api.service';
import { LogService } from './log.service';
import { UserService } from './user.service';
import { SessionService } from './session.service';

@Injectable()
export class ApiRetryService {
    constructor(private apiService: ApiService, private userService: UserService, private logService: LogService) {
    }

    /**
     * Require a login, if there is no session, or if it's expired, throw error
     * user then gets redirected to login
     * @param method The API method to call
     */
    public async requireLogin<T, K>(method: (api: ApiService) => Promise<T>) {
        return this.userService.getCurrentUser()
            .catch(() => {
                // no user session present
                SessionService.markExpired();
            }).then(() => method(this.apiService).then((response) => {
                return response;
            }).catch(async (response: Response) => {
                if (response.status == 401) {
                    // session expired
                    SessionService.markExpired();
                    throw 'Expired!';
                } else {
                    // some other server error
                    this.logService.error(`${response.status}: ${response.statusText}`);
                    throw response;
                }
            }));
    }
}
