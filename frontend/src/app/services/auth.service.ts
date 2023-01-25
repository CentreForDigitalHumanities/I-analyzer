import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { User } from '../models';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private authAPI = 'users';
    private localStorageKey = 'currentUser';

    private currentUserSubject = new BehaviorSubject<User>({} as User);

    constructor(private http: HttpClient) {}

    login(username: string, password: string) {
        const login$ = this.http.post(`${this.authAPI}/login/`, {
            username,
            password,
        });
        const user$ = this.http.get(`${this.authAPI}/user/`);

        return login$.pipe(
            mergeMap(() => user$),
            map((userData) => {
                console.log(userData);
            }),
            catchError((err) => {
                console.error(err);
                return of(err);
            })
        );
    }
}
