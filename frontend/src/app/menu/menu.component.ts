import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { User } from '../models/index';
import { CorpusService } from '../services/index';
import { ConfigService, UserService } from '../services/index';

@Component({
    selector: 'ia-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnDestroy, OnInit { 
    public menuCorporaItems: MenuItem[];
    public currentUser: User | undefined;
    public isAdmin: boolean = false;
    public menuAdminItems: MenuItem[];
    menuOpen: boolean = false;
    
    private routerSubscription: Subscription;

    constructor(private corpusService: CorpusService, private configService: ConfigService, private userService: UserService, private router: Router) {
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

    public async logout() {
        let user = await this.userService.logout();
        this.currentUser = user;
    }

    public async login() {
        this.userService.showLogin(this.router.url);
    }

    private checkCurrentUser() {
        this.userService.getCurrentUser().then(currentUser => {
            if (currentUser) {                
                if (currentUser == this.currentUser) {
                    // nothing changed
                    return;
                }
                this.currentUser = currentUser as User;
                this.isAdmin = this.currentUser.hasRole('admin');
            } else {
                this.isAdmin = false;
            }
            this.setMenuItems();
        }).catch(() => {
            this.currentUser = undefined;
        });
    }

    private setMenuItems() {
        // Note that this call to the corpus service ensures the existence of a CSRF token / cookie.
        // Even on the login screen. If, for some reason, the order of events changes, please make 
        // sure the CSRF cookie is still received from the server (also on login screen, i.e.  before POSTing the credentials).
        this.corpusService.get().then((corpora) => {       
            this.menuCorporaItems = corpora.map(corpus => ({
                label: corpus.title,
                command: (click) => 
                    this.router.navigate(['/search', corpus.name])             
            }));
        });

        this.menuAdminItems = [
            {
                label: 'Search history',
                icon: 'fa fa-history',
                command: (click) => {
                    this.router.navigate(['search-history'])
                }
            },
            ...this.isAdmin
                ? [
                    {
                        label: 'Administration',
                        icon: 'fa fa-cogs',
                        command: (click) => this.gotoAdmin(),
                    }] : [],
            {
                label: 'Logout',
                icon: 'fa fa-sign-out',
                command: (onclick) => this.logout()
            }
        ];

    }

    toggleMenu() {     
       this.menuOpen = !this.menuOpen;
    }
}
