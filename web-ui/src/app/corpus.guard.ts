import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { CorpusService } from './services/index';

@Injectable()
export class CorpusGuard implements CanActivate {
    constructor(private router: Router, private corpusService: CorpusService) {
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if (next.paramMap.has('corpus')) {
            return this.corpusService.set(next.paramMap.get('corpus'));
        }

        return false;
    }
}
