import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { User } from '../models/index';
import { CorpusService } from '../services/index';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { takeUntil, throttleTime } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
    selector: 'ia-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnDestroy, OnInit {
    public menuCorporaItems: MenuItem[];
    public currentUser: User | undefined;
    public isAdmin = false;
    public menuAdminItems: MenuItem[];
    menuOpen = false;

    private routerSubscription: Subscription;
    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService,
        private corpusService: CorpusService,
        private router: Router
    ) {
        this.routerSubscription = router.events
            // throttle router events to make sure this triggers only once upon route change
            .pipe(throttleTime(0))
            .subscribe(() => this.checkCurrentUser());
    }

    ngOnDestroy() {
        this.routerSubscription.unsubscribe();
        this.destroy$.next();
    }

    ngOnInit() {
        this.checkCurrentUser();
    }

    public gotoAdmin() {
        window.location.href = environment.adminUrl;
    }

    public async logout() {
        const isSamlLogin = this.currentUser.isSamlLogin;
        await this.authService.logout(isSamlLogin, true).toPromise();
        this.currentUser = undefined;
    }

    public async login() {
        this.authService.showLogin(this.router.url);
    }

    private checkCurrentUser() {
        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(
            (user) => {
                if (user) {
                    this.currentUser = user;
                    this.isAdmin = this.currentUser.isAdmin;
                } else {
                    this.isAdmin = false;
                }
                this.setMenuItems();
            },
            (_error) => {
                this.currentUser = undefined;
            }
        );
    }

    private setMenuItems() {
        // Note that this call to the corpus service ensures the existence of a CSRF token / cookie.
        // Even on the login screen. If, for some reason, the order of events changes, please make
        // sure the CSRF cookie is still received from the server (also on login screen, i.e.  before POSTing the credentials).
        this.corpusService.get().then((corpora) => {
            this.menuCorporaItems = _.isEmpty(corpora)
                ? [{ label: 'No corpora available.' }]
                : corpora.map((corpus) => ({
                      label: corpus.title,
                      command: (click) =>
                          this.router.navigate(['/search', corpus.name]),
                  }));
        });

        this.menuAdminItems = [
            {
                label: 'Search history',
                icon: 'fa fa-history',
                command: (click) => {
                    this.router.navigate(['search-history']);
                },
            },
            {
                label: 'Downloads',
                icon: 'fa fa-download',
                command: (click) => {
                    this.router.navigate(['download-history']);
                },
            },
            ...(this.isAdmin
                ? [
                      {
                          label: 'Administration',
                          icon: 'fa fa-cogs',
                          command: (click) => this.gotoAdmin(),
                      },
                  ]
                : []),
            {
                label: 'Logout',
                icon: 'fa fa-sign-out',
                command: (onclick) => this.logout(),
            },
        ];
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }
}
