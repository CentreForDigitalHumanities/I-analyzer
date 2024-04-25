import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    private static sessionExpiredSubject = new Subject<void>();
    public expired = SessionService.sessionExpiredSubject.asObservable();

    public static markExpired() {
        SessionService.sessionExpiredSubject.next(undefined);
    }
}
