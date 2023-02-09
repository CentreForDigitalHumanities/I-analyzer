import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { UserResponse } from '../models';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private authAPI = 'users';

    constructor(private http: HttpClient) {}

    getUser(): Observable<UserResponse> {
        return this.http.get<UserResponse>(this.authRoute('user'));
    }

    /** Chains two requests:
     * - /users/login/ to perform the actual login
     * - /users/user/ to obtain user details
     */
    login(username: string, password: string): Observable<UserResponse> {
        const loginRequest$ = this.http.post<{ key: string }>(
            this.authRoute('login'),
            {
                username,
                password,
            }
        );
        return loginRequest$.pipe(
            mergeMap(() => this.getUser()),
            catchError((error) => {
                console.error(error);
                return throwError(error);
            })
        );
    }

    logout() {
        return this.http
            .post<{ detail: string }>(this.authRoute('logout'), {})
            .toPromise();
    }

    private authRoute = (route: string): string => `${this.authAPI}/${route}/`;
}
