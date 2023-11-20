import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, fromEvent, merge, timer } from 'rxjs';
import { User } from '../models/index';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { filter, switchMap, take, takeUntil, throttleTime } from 'rxjs/operators';
import * as _ from 'lodash';
import {
    faBook, faCog, faCogs, faDatabase, faDownload, faHistory, faInfoCircle, faSignOut,
    faUser
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: '[ia-menu]',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnDestroy, OnInit {
    @ViewChild('userDropdown') userDropdown: ElementRef;

    public currentUser: User | undefined;
    adminUrl = environment.adminUrl;
    public isAdmin = false;
    menuOpen = false;
    dropdownOpen$ = new BehaviorSubject<boolean>(false);


    icons = {
        corpora: faDatabase,
        manual: faBook,
        about: faInfoCircle,
        user: faUser,
        searchHistory: faHistory,
        downloads: faDownload,
        settings: faCog,
        admin: faCogs,
        logout: faSignOut,
    };

    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService,
        private router: Router
    ) {
        router.events
            // throttle router events to make sure this triggers only once upon route change
            .pipe(
                throttleTime(0),
                takeUntil(this.destroy$),
            )
            .subscribe(() => this.checkCurrentUser());
    }

    ngOnDestroy() {
        this.destroy$.next();
    }

    ngOnInit() {
        this.checkCurrentUser();

        this.dropdownOpen$.pipe(
            takeUntil(this.destroy$),
            filter(_.identity)
        ).subscribe(this.triggerClose.bind(this));
    }

    toggleDropdown() {
        this.dropdownOpen$.next(!this.dropdownOpen$.value);
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    triggerClose() {
        // listen for clicks and close the dropdown at the next click
        // timer(0) is used to avoid the opening click event being registered
        const clicks$ = timer(0).pipe(
            switchMap(() => fromEvent(document, 'click')),
        );

        // listen for focus moving out of the dropdown
        const focusOutOfDropdown = (event: FocusEvent) =>
            _.isNull(event.relatedTarget) ||
            (event.relatedTarget as Element).parentElement.id !== 'userDropdown';

        const focusOut$ = fromEvent<FocusEvent>(
            this.userDropdown.nativeElement,
            'focusout'
        ).pipe(
            filter(focusOutOfDropdown),
        );

        merge(clicks$, focusOut$).pipe(
            take(1)
        ).subscribe(() => this.dropdownOpen$.next(false));
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
            },
            (_error) => {
                this.currentUser = undefined;
            }
        );
    }

}
