import { Component } from '@angular/core';
import { AuthService } from '@services';
import { formIcons } from '@shared/icons';
import { map } from 'rxjs';

@Component({
    selector: 'ia-change-username',
    templateUrl: './change-username.component.html',
    styleUrl: './change-username.component.scss'
})
export class ChangeUsernameComponent {
    currentName$ = this.authService.currentUser$.pipe(
        map(user => user.name)
    );

    formIcons = formIcons;

    invalidFeedback: string;
    successFeedback: string;

    constructor(
        private authService: AuthService,
    ) {}

    submitName() {
        this.invalidFeedback = undefined;
        this.successFeedback = undefined;

        this.authService.updateSettings({
            name: 'test'
        }).subscribe({
            next: this.onSuccess.bind(this),
            error: this.onRequestFail.bind(this),
        })
    }

    private onSuccess() {
        this.successFeedback = 'Your username has been updated.';
    }

    private onRequestFail(err) {
        this.invalidFeedback = err.error?.username;
    }
}
