import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from './services/auth.service';

import { environment } from '@environments/environment';
import { AlertComponent } from './core/alert/alert.component';
import { AlertService } from './services/alert.service';

@Component({
    selector: 'ia-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false,
})
export class AppComponent implements OnInit {
    @ViewChild('alert') alertComponent: AlertComponent;

    public iframe: boolean;

    constructor(
        private authService: AuthService,
        private alertService: AlertService
    ) {
        this.authService.setInitialAuth();
        this.iframe = environment.runInIFrame;
    }

    ngOnInit(): void {
        if (environment.showNamechangeAlert) {
            this.showNamechangeAlert();
        }
    }

    private showNamechangeAlert(): void {
        this.alertService.alert$.next({
            message:
                '"I-Analyzer" has been renamed, and is now called "Textcavator". Read more about this change on the about page.',
        });
    }
}
