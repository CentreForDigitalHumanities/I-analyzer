import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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

    public isActivated: boolean;

    private returnUrl: string;

    public static activated = false;

    constructor(
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private router: Router,
        private title: Title
    ) {
        this.title.setTitle('I-Analyzer');
        //fix for redirecting users who are not logged in, if false, the user is redirected to the login page
        // TODO: Check if this problem still occurs
        // UserService.loginActivated = true;
    }

    ngOnInit() {
        // get return url from route parameters or default to '/'
        this.returnUrl =
            this.activatedRoute.snapshot.queryParams['returnUrl'] || '/';
        this.activatedRoute.queryParams.subscribe((params) => {
            this.isActivated = params['isActivated'] === 'true';
            this.hasError = params['hasError'] === 'true' || false;

            if (params['solislogin'] === 'true') {
                this.solislogin();
            }
        });
    }

    ngOnDestroy() {
        // TODO: Check if this problem still occurs and needs to be fixed
        // UserService.loginActivated = false;
    }

    login() {
        // this.isLoading = true;
        // this.authService.login(this.username, this.password).then((result) => {
        //     this.handleLoginResponse(result);
        // });
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
