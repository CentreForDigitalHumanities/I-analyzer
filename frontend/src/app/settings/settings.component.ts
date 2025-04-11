import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@services';
import { pageTitle } from '@utils/app';
import { map } from 'rxjs';

@Component({
    selector: 'ia-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    /** whether settings for email/password/username should be shown */
    enableChangeCredentials$ = this.authService.currentUser$.pipe(
        map(user => !user.isSamlLogin)
    );

    constructor(private title: Title, private authService: AuthService) { }

    ngOnInit(): void {
        this.title.setTitle(pageTitle('Settings'));
    }

}
