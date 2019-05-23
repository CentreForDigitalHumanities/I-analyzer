import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class SessionService {
    private static sessionExpiredSubject = new Subject();
    public expired = SessionService.sessionExpiredSubject.asObservable();

    public static markExpired() {
        SessionService.sessionExpiredSubject.next();
    }
}
