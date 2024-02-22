import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Store } from './types';
import { Observable, Subject } from 'rxjs';
import { bufferTime, debounceTime, map } from 'rxjs/operators';
import { mergeAllParams } from '../utils/params';

/**
 * Synchronises stored parameters with the route query parameters
 */
@Injectable({
    providedIn: 'root'
})
export class RouterStoreService implements Store {
    params$: Observable<Params>;
    paramUpdates$ = new Subject<Params>();

    constructor(
        private router: Router
    ) {
        this.params$ = this.router.routerState.root.queryParams;
        this.paramUpdates$.pipe(
            bufferTime(100),
            map(mergeAllParams),
        ).subscribe(this.navigate.bind(this));
    }

    currentParams(): Params {
        return this.router.routerState.snapshot.root.queryParams;
    }

    private navigate(params: Params) {
        const route = this.router.routerState.root;
        this.router.navigate(
            [],
            {
                queryParams: params,
                queryParamsHandling: 'merge',
                relativeTo: route,
            }
        );
    }
}
