import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    public username: string;
    public password: string;
    public isLoading: boolean;
    public isWrong: boolean;

    private returnUrl: string;

    constructor(private userService: UserService, private activatedRoute: ActivatedRoute, private router: Router, private title: Title) {
        this.title.setTitle('I-Analyzer');
    }

    ngOnInit() {
        // get return url from route parameters or default to '/'
        this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/';
    }

    login() {
        this.isLoading = true;
        this.userService.authorize(this.username, this.password).then(result => {
            if (!result) {
                this.isLoading = false;
                this.isWrong = true;
            } else {
                this.router.navigateByUrl(this.returnUrl);
            }
        });
    }
}
