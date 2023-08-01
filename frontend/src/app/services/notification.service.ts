import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service for sending notifications to the user
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private subject = new Subject<Notification>();

    public observable = this.subject.asObservable();

    public showMessage(message: string, type: Notification['type'] = 'warning', link?: NotificationLink) {
        this.subject.next({ message, type, link });
    }
}

interface NotificationLink {
    text: string;
    route: string[];
}

export interface Notification {
    message: string;
    /**
     * Notification type
     */
    type: 'info' | 'warning' | 'danger' | 'success';
    link?: NotificationLink;
}
