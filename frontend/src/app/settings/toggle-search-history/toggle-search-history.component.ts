import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../services';

@Component({
    selector: 'ia-toggle-search-history',
    templateUrl: './toggle-search-history.component.html',
    styleUrls: ['./toggle-search-history.component.scss']
})
export class ToggleSearchHistoryComponent {
    searchHistoryEnabled$: Observable<boolean>;

    constructor(private authService: AuthService) {
        this.searchHistoryEnabled$ = this.authService.currentUser$.pipe(
            map(user => user.enableSearchHistory)
        );
    }

    emitChange(setting: boolean) {
        const data = { enableSearchHistory: setting };
        this.authService.updateSettings(data).subscribe();
    }

}
