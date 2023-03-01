import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

import { environment } from '../../environments/environment';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
    public username: string;
    public password: string;
    public isLoading: boolean;
    public isWrong: boolean;
    public hasError: boolean;

    private returnUrl: string;

    public static activated = false;
    public showSolis: boolean;

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
    private onLoginFail = () => {
        this.isLoading = false;
        this.isWrong = true;
    };
}
