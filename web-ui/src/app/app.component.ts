import { Component } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { ManualService } from './services/manual.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    private pageEventSubscription: Subscription;

    public manualPath: string | undefined;
    public showManual = false;

    constructor(manualService: ManualService) {
        this.pageEventSubscription = manualService.pageEvent.subscribe(event => {
            this.manualPath = event.show ? event.path : undefined;
            this.showManual = !!this.manualPath;
        });
    }
}
