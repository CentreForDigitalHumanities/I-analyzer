import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, fromEvent, merge, of, timer } from 'rxjs';
import { User } from '@models/index';
import { environment } from '@environments/environment';
import { AuthService } from '@services/auth.service';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { navIcons, userIcons } from '@shared/icons';

@Component({
    selector: 'ia-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnDestroy, OnInit {
    @ViewChild('userDropdown') userDropdown: ElementRef;

    appName = environment.appName;
    adminUrl = environment.adminUrl;

    menuOpen$ = new BehaviorSubject<boolean>(false);
    dropdownOpen$ = new BehaviorSubject<boolean>(false);

    user$: Observable<User>;
    isAdmin$: Observable<boolean>;

    route$: Observable<{
        url: string[];
        queryParams: Params;
    }>;

    navIcons = navIcons;
    userIcons = userIcons;

    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    /**
     * whether the brand should explicitly add "i-analyzer" to the app name; not
     * necessary if the app name already includes "i-analyzer"
     */
    get showIAnalyzerInBrand() {
        return ! this.appName.toLowerCase().includes('i-analyzer');
    }

    ngOnDestroy() {
        this.destroy$.next(undefined);
    }

    ngOnInit() {
        this.user$ = this.authService.currentUser$;
        this.isAdmin$ = this.user$.pipe(map((user) => user?.isAdmin));

        this.dropdownOpen$
            .pipe(takeUntil(this.destroy$), filter(_.identity))
            .subscribe(this.triggerCloseDropdown.bind(this));

        this.makeRoute();
    }

    toggleDropdown() {
        this.dropdownOpen$.next(!this.dropdownOpen$.value);
    }

    toggleMenu() {
        this.menuOpen$.next(!this.menuOpen$.value);
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
            this.router.events.pipe(
                filter((event) => event instanceof NavigationEnd)
            )
        );

        this.route$ = routeUpdates$.pipe(
            map(() => this.route.firstChild?.snapshot),
            map((snapshot) => ({
                url: snapshot?.url.map((segment) => segment.path),
                queryParams: snapshot?.queryParams,
            }))
        );
    }

    /** close user dropdown when the user clicks or focuses elsewhere */
    private triggerCloseDropdown() {
        // observable of the next click
        // timer(0) is used to avoid the opening click event being registered
        const clicks$ = timer(0).pipe(
            switchMap(() => fromEvent(document, 'click'))
        );

        // observable of the dropdown losing focus

        const focusOutOfDropdown = (event: FocusEvent) =>
            _.isNull(event.relatedTarget) ||
            (event.relatedTarget as Element).parentElement.id !==
                'userDropdown';

        const focusOut$ = fromEvent<FocusEvent>(
            this.userDropdown.nativeElement,
            'focusout'
        ).pipe(filter(focusOutOfDropdown));

        // when either of these happens, close the dropdown
        merge(clicks$, focusOut$)
            .pipe(take(1))
            .subscribe(() => this.dropdownOpen$.next(false));
    }
}
