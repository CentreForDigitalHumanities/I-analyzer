import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { User } from '../models/user';

import { Subject, Subscription } from 'rxjs';

const localStorageKey = 'currentUser';
const sessionCheckInterval = 10000;

@Injectable()
export class UserService implements OnDestroy {
    private deserializedCurrentUser: User | false = false;
    private sessionExpiredSubscription: Subscription;
    // Basic behavior:
    // - If the session on the API server hasn't been checked for 10 seconds it will be checked again.
    // - If the user logs on or off, the value is directly updated.
    // - If an API call returns that the session has expired, the value is also updated (because logoff() will be called).
    private sessionCheckPromise: Promise<boolean> = Promise.resolve(false);
    // The session on the API server might have expired (or the admin could have logged off)
    private requestSessionCheck = new Subject();
    private sessionCheckSubscription = this.requestSessionCheck.throttleTime(sessionCheckInterval)
        .subscribe(() => {
            this.sessionCheckPromise = !this.currentUser
                ? Promise.resolve(false)
                : this.apiService.checkSession({ username: this.currentUser.name })
                    .then(response => {
                        if (!response.success) {
                            return false;
                        }
                        return true;
                    }).catch(() => {
                        return false;
                    }).then((success) => {
                        if (!success) {
                            this.currentUser = false;
                        }

                        return success;
                    })
        });

    public get currentUser(): User | false {
        if (this.deserializedCurrentUser) {
            return this.deserializedCurrentUser;
        }

        let value = localStorage.getItem(localStorageKey);
        if (value) {
            let parsed = JSON.parse(value);
            return new User(parsed['name'], parsed['roles']);
        } else {
            return false;
        }
    }

    public set currentUser(value: User | false) {
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
            this.logout(false);
        });
    }

    ngOnDestroy() {
        if (this.sessionExpiredSubscription) {
            this.sessionExpiredSubscription.unsubscribe();
        }
    }

    /**
     * Check that the user is still logged on
     */
    public checkSession(): Promise<boolean> {
        this.requestSessionCheck.next();
        return this.sessionCheckPromise;
    }

    public login(username: string, password: string): Promise<User | false> {
        return this.apiService.login({ username, password }).then(result => {
            if (result.success) {
                this.currentUser = new User(result.username, result.roles);
                return this.currentUser;
            }

            return false;
        }).then(user => {
            this.sessionCheckPromise = Promise.resolve(!!user);
            return user;
        });
    }

    public logout(notifyServer: boolean = true) {
        this.currentUser = false;
        this.sessionCheckPromise = Promise.resolve(false);
        this.apiService.logout().then(() =>
            this.router.navigateByUrl('/login'));
    }
}
