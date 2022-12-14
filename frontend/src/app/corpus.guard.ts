import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { CorpusService, NotificationService, UserService } from './services/index';

@Injectable()
export class CorpusGuard implements CanActivate {
    constructor(private router: Router, private notificationService: NotificationService, private corpusService: CorpusService, private userService: UserService) {
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if (next.paramMap.has('corpus')) {
            return this.corpusService.set(next.paramMap.get('corpus')).then(authorized => {
                if (!authorized) {
                    this.notificationService.showMessage('You do not have access to this corpus. Log in as an authorized user.', 'danger');
                    this.userService.showLogin(state.url);
                }
                return authorized;
            });
        }

        return false;
    }
}
