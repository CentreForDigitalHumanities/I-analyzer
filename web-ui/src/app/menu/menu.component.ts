import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuItem } from 'primeng/primeng';
import { User } from '../models/index';
import { ConfigService, UserService } from '../services/index';

@Component({
    selector: 'menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnDestroy, OnInit {
    public currentUser: User | undefined;
    public isAdmin: boolean = false;

    private routerSubscription: Subscription;
    private menuItems: MenuItem[];

    constructor(private configService: ConfigService, private userService: UserService, private router: Router) {
        this.routerSubscription = router.events.subscribe(() => this.checkCurrentUser());
    }

    ngOnDestroy() {
        this.routerSubscription.unsubscribe();
    }

    ngOnInit() {
        this.checkCurrentUser();
    }

    public gotoAdmin() {
        this.configService.get().then(config => {
            window.location.href = config.adminUrl;
        });
    }

    public logout() {
        this.currentUser = undefined;
        this.userService.logout();
    }

    private checkCurrentUser() {
        this.userService.checkSession().then(success => {
            if (success && this.userService.currentUser) {
                if (this.userService.currentUser == this.currentUser) {
                    // nothing changed
                    return;
                }
                this.currentUser = this.userService.currentUser;
                this.isAdmin = this.currentUser.hasRole('admin');
            } else {
                this.isAdmin = false;
            }

            this.setMenuItems();
        });
    }

    private setMenuItems() {
        this.menuItems = [
            {
                label: 'Search history',
                icon: 'fa-history',
                url: '#'
            },
            ...this.isAdmin ? [
                {
                    label: 'Administration',
                    icon: 'fa-cogs',
                    command: (click) => this.gotoAdmin(),
                }] : [],
            {
                label: 'Exit',
                icon: 'fa-sign-out',
                command: (onclick) => this.logout()
            }
        ];
    }
}
