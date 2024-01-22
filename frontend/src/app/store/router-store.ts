import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Store } from './types';
import { Observable, Subject } from 'rxjs';
import { debounce, debounceTime } from 'rxjs/operators';

/**
 * Synchronises stored parameters with the route query parameters
 */
@Injectable({
    providedIn: 'root'
})
export class RouterStore implements Store {
    params$: Observable<Params>;
    paramUpdates$ = new Subject<Params>();

    constructor(
        private router: Router
    ) {
        this.params$ = this.router.routerState.root.queryParams;
        this.paramUpdates$.pipe(
            debounceTime(100),
        ).subscribe(this.navigate.bind(this));
    }

    private navigate(params: Params) {
        const route = this.router.routerState.root;
        this.router.navigate(
            ['.'],
            {
                queryParams: params,
                queryParamsHandling: 'merge',
                relativeTo: route,
            }
        );
    }
}
