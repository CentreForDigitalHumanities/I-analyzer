import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { User } from '../models/user';

import { Subject, Subscription } from 'rxjs';
import { LoginComponent } from '../login/login.component';

const localStorageKey = 'currentUser';
const sessionCheckInterval = 10000;

@Injectable()
export class UserService implements OnDestroy {
    // workaround for logging out "expired" users, including those who never logged on in the first place
    public static loginActivated = false;
    private deserializedCurrentUser: User | false = false;
    private sessionExpiredSubscription: Subscription;
    /**
     * Is it possible to login as guest without a password? Assume this is true, until proven otherwise
     */
    private supportGuest = true;
    // Basic behavior:
    // - If the session on the API server hasn't been checked for 10 seconds it will be checked again.
    // - If the user logs on or off, the value is directly updated.
    // - If an API call returns that the session has expired, the value is also updated (because logoff() will be called).
    private sessionCheckPromise: Promise<boolean> = Promise.resolve<boolean>(false);
    // The session on the API server might have expired (or the admin could have logged off)
    private requestSessionCheck = new Subject();
    private sessionCheckSubscription = this.requestSessionCheck.throttleTime(sessionCheckInterval)
        .subscribe(async () => {
            let currentUser = await this.getCurrentUserOrFallback();
            this.sessionCheckPromise = !currentUser
                ? Promise.resolve(false)
                : this.apiService.checkSession({ username: currentUser.name })
                    .then(response => {
                        if (!response.success) {
                            return false;
                        }
                        return true;
                    }).catch(() => {
                        return false;
                    }).then((result) => {
                        if (!result) {
                            this.currentUser = false;
                        }

                        return result;
                    });
        });

    /**
     * Get the current user or fallback to guest
     */
    private async getCurrentUserOrFallback() {
        await this.sessionCheckPromise;
        return this.currentUser || this.supportGuest && await this.loginAsGuest() || false;
    }

    private get currentUser(): User | false {
        if (this.deserializedCurrentUser) {
            return this.deserializedCurrentUser;
        }

        let value = localStorage.getItem(localStorageKey);
        if (value) {
            let parsed = JSON.parse(value);
            return new User(parsed['id'], parsed['name'], parsed['role'], parsed['downloadLimit'], parsed['queries']);
        } else {
            return false;
        }
    }

    private set currentUser(value: User | false) {
        this.deserializedCurrentUser = value;
        if (!value) {
            localStorage.removeItem(localStorageKey)
        } else {
            localStorage.setItem(localStorageKey, JSON.stringify(value));
        }
    }



    constructor(private apiService: ApiService, private sessionService: SessionService, private router: Router) {
        this.sessionExpiredSubscription = this.sessionService.expired.subscribe(() => {
            // no need to notify the server that we are going to logoff, because it told us this is already the case
            this.logout(false, true);
        });
    }

    ngOnDestroy() {
        if (this.sessionExpiredSubscription) {
            this.sessionExpiredSubscription.unsubscribe();
        }
    }

    /**
     * Gets the current user, fallback to guest (if possible) and reject if no user is available.
     */
    public async getCurrentUser(fallback = false): Promise<User> {
        if (!fallback) {
            if (this.currentUser) {
                return this.currentUser;
            }
            throw 'Not logged on';
        }
        let currentUser = await this.getCurrentUserOrFallback();
        if (currentUser) {
            return currentUser;
        }

        throw 'Not logged on';
    }

    public login(username: string, password: string = null): Promise<User | false> {
        let loginPromise = this.apiService.login({ username, password }).then(result => {
            if (result.success) {                
                if (username == 'guest') {
                    this.supportGuest = !password;
                }

                return this.processLoginSucces(result);
            } else if (username == 'guest' && !password) {
                this.supportGuest = false;
            }

            return false;
        });

        this.sessionCheckPromise = loginPromise.then(user => !!user);

        return loginPromise;
    }


    /**
     * Do the actual login with SolisId
     */
    public async solisLogin(): Promise<User | false> {
        await this.sessionCheckPromise;
        let loginPromise = this.apiService.solisLogin().then(result => {
            if (result.success) {
                return this.processLoginSucces(result);
            }

            return false;
        });

        this.sessionCheckPromise = loginPromise.then(user => !!user);

        return loginPromise;
    }

    /**
     * Create user and assign it to this.currentUser
     * @param result The result from the API call
     */
    private processLoginSucces(result): User {
        this.currentUser = new User(
            result.id,
            result.username,
            result.role,
            result.downloadLimit == null ? 0 : result.downloadLimit,
            result.queries);

        return this.currentUser;
    }


    /**
     * Registration of new user.
     */
    public register(username: string, email: string, password: string):
        Promise<{ success: boolean, is_valid_username: boolean, is_valid_email: boolean }> {
        return this.apiService.register({ username, email, password })
    }


    public async loginAsGuest() {
        await this.sessionCheckPromise;
        if (this.supportGuest) {
            return this.login('guest');
        } else {
            return false;
        }
    }

    public async logout(notifyServer: boolean = true, redirectToLogout: boolean = true): Promise<User | undefined> {
        let guestUser = await this.loginAsGuest();
        if (guestUser) {
            // switched back to guest user
            this.currentUser = guestUser;
        } else {
            this.currentUser = false;
            this.sessionCheckPromise = Promise.resolve(false);
        }

        if (notifyServer) {
            await this.apiService.logout().then(result => {
                if (result.samlLogout) {
                    window.location.href = 'api/init_solislogout'
                }
            });
        }

        if (redirectToLogout && !UserService.loginActivated) {
            this.showLogin();
        }

        return guestUser || undefined;
    }

    public showLogin(returnUrl?: string) {
        this.router.navigate(['/login'], returnUrl ? { queryParams: { returnUrl } } : undefined);
    }
}
