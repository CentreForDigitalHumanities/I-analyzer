import { Component, OnInit } from '@angular/core';
import { ApiService, NotificationService } from '../../../services';
import { tap } from 'rxjs/operators';
import { actionIcons } from '../../../shared/icons';

@Component({
    selector: 'ia-delete-search-history',
    templateUrl: './delete-search-history.component.html',
    styleUrls: ['./delete-search-history.component.scss']
})
export class DeleteSearchHistoryComponent {
    actionIcons = actionIcons;

    showConfirm = false;

    constructor(private apiService: ApiService, private notificationService: NotificationService) { }

    deleteHistory() {
        this.apiService.deleteSearchHistory().pipe(
            tap(() => this.showConfirm = false)
        ).subscribe(
            res => this.notificationService.showMessage('Search history deleted', 'success'),
            err => this.notificationService.showMessage('Deleting search history failed', 'danger'),
        );
    }
}
