import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    public iframe: boolean

    constructor(private authService: AuthService) {
        this.authService.setInitialAuth();
        this.iframe = environment.runInIFrame;
    }
}

