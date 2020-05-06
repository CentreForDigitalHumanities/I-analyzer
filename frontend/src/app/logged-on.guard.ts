import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { UserService } from './services/index';

@Injectable()
export class LoggedOnGuard implements CanActivate {
    constructor(private router: Router, private userService: UserService) {
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Promise<boolean> {
        return this.userService.getCurrentUser(true)
            .then(user => !!user)
            .catch(() => {
                this.userService.showLogin(state.url);
                return false;
            });
    }
}
