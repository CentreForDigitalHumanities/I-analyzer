import { Component } from '@angular/core';
import { formIcons } from '@shared/icons';

@Component({
    selector: 'ia-change-username',
    templateUrl: './change-username.component.html',
    styleUrl: './change-username.component.scss'
})
export class ChangeUsernameComponent {
    formIcons = formIcons;

    invalidFeedback: string;
}
