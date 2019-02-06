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
     * Require a login, if this isn't present or expired a fallback to the guest user is attempted.
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
                    if (await this.userService.loginAsGuest()) {
                        return method(this.apiService);
                    } else {
                        // not allowed to fallback to guest
                        SessionService.markExpired();
                        throw 'Expired!';
                    }
                } else {
                    // some other server error
                    this.logService.error(`${response.status}: ${response.statusText}`);
                    throw response;
                }
            }));
    }
}
