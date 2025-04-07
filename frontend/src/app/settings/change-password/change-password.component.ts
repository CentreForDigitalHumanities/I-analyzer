import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AuthService } from '@services';
import { formIcons } from '@shared/icons';
import * as _ from 'lodash';

interface FormFeedback {
    oldPassword: string|undefined;
    newPassword1: string|undefined;
    newPassword2: string|undefined;
}

@Component({
    selector: 'ia-change-password',
    templateUrl: './change-password.component.html',
    styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
    formIcons = formIcons;

    form = new FormGroup({
        oldPassword: new FormControl(),
        newPassword1: new FormControl(),
        newPassword2: new FormControl(),
    });

    invalidFeedback: FormFeedback = this.emptyFeedback();
    successFeedback: string;

    constructor(
        private authService: AuthService
    ) { }

    submit() {
        const data = this.form.value;
        this.authService.changePassword(
            data.oldPassword, data.newPassword1, data.newPassword2
        ).subscribe({
            next: this.onSuccess.bind(this),
            error: this.onRequestError.bind(this),
        });
    }

    private onSuccess(response: any) {
        this.invalidFeedback = this.emptyFeedback();
        this.successFeedback = response.detail;
        this.form.reset();
    }

    private onRequestError(data: any) {
        console.error(data);

        this.invalidFeedback.oldPassword = this.formatErrorText(data.error['old_password']);
        this.invalidFeedback.newPassword1 = this.formatErrorText(data.error['new_password1']);
        this.invalidFeedback.newPassword2 = this.formatErrorText(data.error['new_password2']);
    }

    private formatErrorText(text: string | string[]): string {
        if (_.isArray(text)) {
            return text.join(' ');
        } else {
            return text;
        }
    }

    private emptyFeedback() {
        return {
            oldPassword: undefined,
            newPassword1: undefined,
            newPassword2: undefined,
        }
    }

}
