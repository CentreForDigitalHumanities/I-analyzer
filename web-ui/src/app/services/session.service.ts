import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class SessionService {
    private static sessionExpiredSubject = new Subject();
    public expired = SessionService.sessionExpiredSubject.asObservable();

    public static markExpired() {
        console.log(this)
        SessionService.sessionExpiredSubject.next();
    }
}
