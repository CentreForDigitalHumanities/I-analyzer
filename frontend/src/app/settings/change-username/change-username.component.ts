import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
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

    form = new FormGroup({
        name: new FormControl<string>(''),
    });

    formIcons = formIcons;

    invalidFeedback: string;
    successFeedback: string;

    constructor(
        private authService: AuthService,
    ) {
        this.authService.currentUser$.pipe(
            map(user=> user.name),
            takeUntilDestroyed(),
        ).subscribe(name => this.form.setValue({name}))
    }

    submitName() {
        this.invalidFeedback = undefined;
        this.successFeedback = undefined;

        this.authService.updateSettings(this.form.value).subscribe({
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
