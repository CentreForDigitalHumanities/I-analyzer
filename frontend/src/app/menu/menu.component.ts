import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, fromEvent, merge, of, timer } from 'rxjs';
import { User } from '../models/index';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
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

    adminUrl = environment.adminUrl;

    menuOpen = false;
    dropdownOpen$ = new BehaviorSubject<boolean>(false);

    user$: Observable<User>;
    isAdmin$: Observable<boolean>;

    route$: Observable<{
        url: string[];
        queryParams: Params;
    }>;

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
        private router: Router,
        private route: ActivatedRoute,
    ) { }

    ngOnDestroy() {
        this.destroy$.next();
    }

    ngOnInit() {
        this.checkCurrentUser();

        this.dropdownOpen$.pipe(
            takeUntil(this.destroy$),
            filter(_.identity)
        ).subscribe(this.triggerCloseDropdown.bind(this));

        this.makeRoute();
    }

    toggleDropdown() {
        this.dropdownOpen$.next(!this.dropdownOpen$.value);
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    public async logout() {
        this.authService.logout(true).subscribe();
    }

    public async login() {
        this.authService.showLogin(this.router.url);
    }

    private makeRoute(): void {
        // observable that fires immediately, and after navigation
        const routeUpdates$ = merge(
            of(null),
            this.router.events.pipe(filter(event => event instanceof NavigationEnd))
        );

        this.route$ = routeUpdates$.pipe(
            map(() => this.route.firstChild?.snapshot),
            map(snapshot => ({
                url: snapshot?.url.map(segment => segment.path),
                queryParams: snapshot?.queryParams,
            }))
        );
    }

    /** close user dropdown when the user clicks or focuses elsewhere */
    private triggerCloseDropdown() {
        // observable of the next click
        // timer(0) is used to avoid the opening click event being registered
        const clicks$ = timer(0).pipe(
            switchMap(() => fromEvent(document, 'click')),
        );

        // observable of the dropdown losing focus

        const focusOutOfDropdown = (event: FocusEvent) =>
            _.isNull(event.relatedTarget) ||
            (event.relatedTarget as Element).parentElement.id !== 'userDropdown';

        const focusOut$ = fromEvent<FocusEvent>(
            this.userDropdown.nativeElement,
            'focusout'
        ).pipe(
            filter(focusOutOfDropdown),
        );

        // when either of these happens, close the dropdown
        merge(clicks$, focusOut$).pipe(
            take(1)
        ).subscribe(() => this.dropdownOpen$.next(false));
    }

    private checkCurrentUser() {
        this.user$ = this.authService.currentUser$;
        this.isAdmin$ = this.user$.pipe(map(user => user?.isAdmin));
    }

}
