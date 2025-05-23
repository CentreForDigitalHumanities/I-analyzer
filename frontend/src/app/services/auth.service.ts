/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
    BehaviorSubject,
    Observable,
    ReplaySubject,
    Subject,
    throwError
} from 'rxjs';
import {
    catchError,
    distinctUntilChanged, mergeMap,
    takeUntil, tap
} from 'rxjs/operators';
import { environment } from '@environments/environment';
import { User, UserResponse } from '@models';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import * as _ from 'lodash';
import { encodeUserData, parseUserData } from '@utils/user';

@Injectable({
    providedIn: 'root',
})
export class AuthService implements OnDestroy {
    private destroy$ = new Subject<void>();
    private sessionExpired = this.sessionService.expired;

    // currentUser can only be set via subject in this service
    private currentUserSubject = new BehaviorSubject<User>(null);
    public currentUser$ = this.currentUserSubject
        .asObservable()
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$));
    // Provide the currentUser as a Promise to adapt to existing functionality
    public currentUserPromise = this.currentUser$.toPromise();

    public notVerifiedMsg = 'E-mail is not verified.';

    // authenticated state
    private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(
        private sessionService: SessionService,
        private apiService: ApiService,
        private router: Router
    ) {
        this.sessionExpired.subscribe(() => this.logout());
    }

    ngOnDestroy(): void {
        this.destroy$.next(undefined);
    }

    /**
     * Sets the current user
     * Updates localstorage, and provides new values for the relevant subjects
     *
     * @param user User object, not response data
     */
    private setAuth(user: User): void {
        // TODO: reinstate localStorage with session information (if needed)
        // localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
    }

    /**
     * Removes current user
     */
    private purgeAuth(): void {
        // localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
    }

    public setInitialAuth(): void {
        this.apiService
            .getUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe(
                (result) => this.setAuth(parseUserData(result)),
                () => this.purgeAuth()
            );
    }

    public getCurrentUser(): User {
        return this.currentUserSubject.value;
    }

    public getCurrentUserPromise(): Promise<User> {
        const currentUser = this.currentUserSubject.value;
        return Promise.resolve(currentUser);
    }

    checkUser(): Observable<UserResponse> {
        return this.apiService.getUser();
    }

    /**
     * Logs in, retrieves user response, transforms to User object
     */
    public login(username: string, password: string): Observable<UserResponse> {
        const loginRequest$ = this.apiService.login(username, password);
        return loginRequest$.pipe(
            mergeMap(() => this.checkUser()),
            tap((res) => this.setAuth(parseUserData(res))),
            catchError((error) => {
                console.error(error);
                return throwError(error);
            })
        );
    }

    public logout(redirectToLogin: boolean = false) {
        const isSamlLogin = this.currentUserSubject.value.isSamlLogin;
        this.purgeAuth();
        if (isSamlLogin) {
            window.location.href = environment.samlLogoutUrl;
        }
        return this.apiService.logout().pipe(
            tap(() => {
                if (redirectToLogin) {
                    this.showLogin();
                }
            })
        );
    }

    public register(username, email, password1, password2) {
        return this.apiService.register({
            username,
            email,
            password1,
            password2,
        });
    }

    public verify(key: string) {
        return this.apiService.verify(key);
    }

    public keyInfo(key: string) {
        return this.apiService.keyInfo(key);
    }

    public showLogin(returnUrl?: string) {
        this.router.navigate(
            ['/login'],
            returnUrl ? { queryParams: { returnUrl } } : undefined
        );
    }

    public requestResetPassword(email: string) {
        return this.apiService.requestResetPassword(email);
    }

    public resetPassword(
        uid: string,
        token: string,
        newPassword1: string,
        newPassword2: string
    ) {
        return this.apiService.resetPassword(
            uid,
            token,
            newPassword1,
            newPassword2
        );
    }

    changePassword(oldPassword: string, newPassword1: string, newPassword2: string) {
        return this.apiService.changePassword(oldPassword, newPassword1, newPassword2);
    }

    public updateSettings(update: Partial<User>) {
        return this.apiService.updateUserSettings(encodeUserData(update)).pipe(
            tap((res) => this.setAuth(parseUserData(res))),
            catchError((error) => {
                console.error(error);
                return throwError(error);
            })
        );
    }

}
