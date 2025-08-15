import { Component } from '@angular/core';
import { ApiService, NotificationService } from '@services';
import { actionIcons } from '@shared/icons';

@Component({
    selector: 'ia-delete-search-history',
    templateUrl: './delete-search-history.component.html',
    styleUrls: ['./delete-search-history.component.scss'],
    standalone: false
})
export class DeleteSearchHistoryComponent {
    actionIcons = actionIcons;

    constructor(private apiService: ApiService, private notificationService: NotificationService) { }

    deleteHistory() {
        this.apiService.deleteSearchHistory().subscribe({
            next: () => this.notificationService.showMessage('Search history deleted', 'success'),
            error: () => this.notificationService.showMessage('Deleting search history failed', 'danger'),
        });
    }
}
