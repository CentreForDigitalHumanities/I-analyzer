import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/index';
import { ConfigService, UserService } from '../services/index';

@Component({
    selector: 'menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
    public currentUser: User;
    public isAdmin = false;

    constructor(private configService: ConfigService, private userService: UserService, private router: Router) { }

    public gotoAdmin() {
        this.configService.get().then(config => {
            window.location.href = config.adminUrl;
        });
    }

    public logout() {
        this.userService.logoff();
        this.router.navigateByUrl('/login');
    }

    ngOnInit() {
        if (this.userService.currentUser) {
            this.currentUser = this.userService.currentUser;
            this.isAdmin = this.currentUser.hasRole('admin');
        } else {
            this.isAdmin = false;
        }
    }


}
