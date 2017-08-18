import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User } from '../models/user';

import { Subscription } from 'rxjs';

const localStorageKey = 'currentUser';

@Injectable()
export class UserService implements OnDestroy {
    private deserializedCurrentUser: User | false = false;
    private sessionExpiredSubscription: Subscription;

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

    constructor(private apiService: ApiService, private router: Router) {
        this.sessionExpiredSubscription = this.apiService.SessionExpired.subscribe(() => {
            this.logoff();
        });
    }

    ngOnDestroy() {
        if (this.sessionExpiredSubscription) {
            this.sessionExpiredSubscription.unsubscribe();
        }
    }

    public authorize(username: string, password: string): Promise<User | false> {
        return this.apiService.post<any>('login', { username, password }).then(result => {
            if (result.success) {
                this.currentUser = new User(result.username, result.roles);
                return this.currentUser;
            }

            return false;
        });
    }

    public logoff() {
        this.currentUser = false;
        this.router.navigateByUrl('/login');
    }
}
