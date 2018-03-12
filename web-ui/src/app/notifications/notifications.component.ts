import { Component, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs/Subscription";

import { Notification, NotificationService } from '../services/notification.service';

const notificationClassMap: {[T in Notification['type']]: NotificationDisplay['class']} = {
    info: 'is-info',
    warning: 'is-warning',
    danger: 'is-danger'
}

@Component({
    selector: 'ia-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnDestroy {
    defaultTimeout = 10000;

    subscription: Subscription;
    private notifications: NotificationDisplay[] = [];

    constructor(notificationService: NotificationService) {
        this.subscription = notificationService.observable.subscribe(notification => this.showNotification(notification));
    }

    private showNotification(notification: Notification) {
        let notificationDisplay: NotificationDisplay = {
            canDelete: true,
            fadeOut: false,
            message: notification.message,
            class: notificationClassMap[notification.type]
        };

        this.notifications.push(notificationDisplay);

        notificationDisplay.timeout = setTimeout(() => this.remove(notificationDisplay), this.defaultTimeout);
    }

    public remove(notification: NotificationDisplay) {
        notification.canDelete = false;
        notification.fadeOut = true;
        setTimeout(() => {
            this.notifications = this.notifications.filter(candidate => candidate != notification);
            if (notification.timeout) {
                clearTimeout(notification.timeout);
            }
        }, 2000);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

interface NotificationDisplay {
    canDelete: boolean,
    fadeOut: boolean,
    message: string,
    // class type of the Bulma notification
    class: 'is-primary' | 'is-info' | 'is-success' | 'is-warning' | 'is-danger',
    timeout?
}
