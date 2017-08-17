import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User } from '../models/user';

const localStorageKey = 'currentUser';

@Injectable()
export class UserService {
    private deserializedCurrentUser: User | false = false;

    public get currentUser(): User | false {
        if (this.deserializedCurrentUser) {
            return this.deserializedCurrentUser;
        }

        let value = localStorage.getItem(localStorageKey);
        if (value) {
            let parsed = JSON.parse(value);
            return new User(parsed['name'] , parsed['roles']);
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

    constructor(private apiService: ApiService) { }

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
    }
}
