import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterState } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { debounceTime, filter, map, takeUntil, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ParamCoordinator {
    /** observer to which models can push updates */
    paramUpdates$ = new Subject<Params>();

    /** observable from which the latest parameter state can be read */
    params$: Observable<Params>;

    private complete$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.params$ = this.router.routerState.root.queryParams.pipe(
            takeUntil(this.complete$),
            debounceTime(100),
        );

        this.paramUpdates$.pipe(
            takeUntil(this.complete$),
            debounceTime(100)
        ).subscribe(this.navigate.bind(this));
    }

    setParams(params: Params) {
        this.paramUpdates$.next(params);
    }

    complete() {
        this.paramUpdates$.complete();
        this.complete$.next();
        this.complete$.complete();
    }

    private navigate(params: Params) {
        this.router.navigate(
            ['.'],
            {
                queryParams: params,
                queryParamsHandling: 'merge',
                relativeTo: this.route
            }
        );
    }
}
