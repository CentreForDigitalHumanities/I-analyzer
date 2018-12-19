import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
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

    constructor(private userService: UserService, private activatedRoute: ActivatedRoute, private router: Router, private title: Title) {
        this.title.setTitle('I-Analyzer');
        //fix for redirecting users who are not logged in, if false, the user is redirected to the login page
        UserService.loginActivated = true;
    }

    ngOnInit() {
        // get return url from route parameters or default to '/'
        this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/';
        this.activatedRoute.queryParams.subscribe( params => {
            this.isActivated = params['isActivated'] === 'true';
            this.hasError = params['hasError'] === 'true' || false;

            if (params['solisId']) {
                this.solislogin(params['solisId']);
            } 
        });
    }
    ngOnDestroy() {
        UserService.loginActivated = false;
    }
    login() {
        this.isLoading = true;
        this.userService.login(this.username, this.password).then(result => {
            this.handleLoginResponse(result);
        });
    }

    solislogin(solisId: string): void {
        this.isLoading = true;
        this.userService.solisLogin(solisId).then(result => {
           this.handleLoginResponse(result); 
        });
    }

    handleLoginResponse(result) {
        if (!result) {
            this.isLoading = false;
            this.isWrong = true;
        } else {                
            this.router.navigateByUrl(this.returnUrl);
        }
    }
}
