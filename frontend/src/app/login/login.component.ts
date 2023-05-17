import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
    public static activated = false;
    public username: string;
    public password: string;
    public isLoading: boolean;
    public isWrong: boolean;
    public isNotVerified: boolean;
    public hasError: boolean;

    public showSolis: boolean;

    private returnUrl: string;

    private destroy$ = new Subject<boolean>();

    constructor(
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private router: Router,
        private title: Title
    ) {
        this.title.setTitle('I-Analyzer');
    }

    ngOnInit() {
        // get return url from route parameters or default to '/'
        this.returnUrl =
            this.activatedRoute.snapshot.queryParams['returnUrl'] || '/';

        // redirect if user is already logged in
        this.authService.isAuthenticated$
            .pipe(takeUntil(this.destroy$))
            .subscribe((state) => {
                if (!!state) {
                    this.router.navigate([this.returnUrl]);
                }
            });

        this.activatedRoute.queryParams.subscribe((params) => {
            this.hasError = params['hasError'] === 'true' || false;

            // TODO: solis
            if (params['solislogin'] === 'true') {
                this.solislogin();
            }
        });
        this.showSolis = environment.showSolis;
    }

    ngOnDestroy() {
        this.destroy$.next(true);
    }

    login() {
        this.isLoading = true;
        this.authService
            .login(this.username, this.password)
            .pipe(
                tap(() => {
                    this.isWrong = undefined;
                    this.isNotVerified = undefined;
                    this.hasError = undefined;
                })
            )
            .subscribe(this.onLoginSuccess, this.onLoginFail);
    }

    solislogin(): void {
        // TODO: Solis login
        // this.isLoading = true;
        // this.userService.solisLogin().then((result) => {
        //     this.handleLoginResponse(result);
        // });
    }

    private onLoginSuccess = () => this.router.navigateByUrl(this.returnUrl);
    private onLoginFail = (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (this.notVerified(error)) {
            this.isNotVerified = true;
        } else if (this.isServerError(error)) {
            this.hasError = true;
        } else {
            this.isWrong = true;
        }
    };

    private notVerified = (err: HttpErrorResponse) =>
        err.status === 400 &&
        err.error?.non_field_errors &&
        err.error?.non_field_errors[0] === this.authService.notVerifiedMsg;

    private isServerError = (err: HttpErrorResponse) =>
        err.status >= 500 && err.status <= 599;
}
