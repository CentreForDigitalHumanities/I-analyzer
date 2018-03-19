import { Subject } from 'rxjs/Subject';

/**
 * Service for sending notifications to the user
 */
export class NotificationService {
    private subject = new Subject<Notification>();

    public observable = this.subject.asObservable();

    public showMessage(message: string, type: Notification['type'] = 'warning') {
        this.subject.next({ message, type });
    }
}

export interface Notification {
    message: string,
    /**
     * Notification type
     */
    type: 'info' | 'warning' | 'danger' | 'success'
}
