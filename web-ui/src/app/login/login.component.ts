import { Component, OnInit } from '@angular/core';
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

    private returnUrl: string;

    constructor(private userService: UserService, private activatedRoute: ActivatedRoute, private router: Router) { }

    ngOnInit() {
        // get return url from route parameters or default to '/'
        this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/';
    }

    login() {
        // TODO: show that we are loading!
        this.userService.authorize(this.username, this.password).then(result => {
            console.log(result);
            if (!result) {
                // TODO: something better!
                alert('Invalid username, password or Zodiac sign. Please try again with different (preferably correct) information.');
            } else {
                this.router.navigateByUrl(this.returnUrl);
            }
        });
    }
}
