import { Injectable } from '@angular/core';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

@Injectable()
export class ApiRetryService {
    constructor(
        private apiService: ApiService,
        private authService: AuthService
    ) {}

    /**
     * Require a login, if there is no session, or if it's expired, throw error
     * user then gets redirected to login
     *
     * @param method The API method to call
     */
    public async requireLogin<T, K>(method: (api: ApiService) => Promise<T>) {
        return this.authService
            .getCurrentUserPromise()
            .catch(() => {
                // no user session present
                SessionService.markExpired();
            })
            .then(() =>
                method(this.apiService)
                    .then((response) => response)
                    .catch(async (response: Response) => {
                        if (response.status === 401) {
                            // session expired
                            SessionService.markExpired();
                            throw new Error('Expired!');
                        } else {
                            // some other server error
                            throw response;
                        }
                    })
            );
    }
}
