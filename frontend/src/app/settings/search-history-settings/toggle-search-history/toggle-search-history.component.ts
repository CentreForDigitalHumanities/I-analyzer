import { Component } from '@angular/core';
import { AuthService, NotificationService } from '../../../services';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
    selector: 'ia-toggle-search-history',
    templateUrl: './toggle-search-history.component.html',
    styleUrls: ['./toggle-search-history.component.scss']
})
export class ToggleSearchHistoryComponent {
    searchHistoryEnabled$: Observable<boolean>;

    constructor(private authService: AuthService, private notificationService: NotificationService) {
        this.searchHistoryEnabled$ = this.authService.currentUser$.pipe(
            map(user => user?.enableSearchHistory)
        );
    }

    emitChange(setting: boolean) {
        const data = { enableSearchHistory: setting };
        const succesMessage = `Search history will ${setting ? '' : 'not '} be saved from now on`;
        this.authService.updateSettings(data).subscribe(
            res => this.notificationService.showMessage(succesMessage, 'success'),
            err => this.notificationService.showMessage(
                'An error occured while trying to save your search history setting',
                'danger'
            ),
        );
    }

}
