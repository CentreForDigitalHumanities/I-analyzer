import { Component, OnDestroy } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

import { Subscription } from 'rxjs/Subscription';

import { ManualService } from '../services/manual.service';

/**
 * Component for showing a dialog containing a requested manual page.
 */
@Component({
    selector: 'ia-manual-dialog',
    templateUrl: './manual-dialog.component.html',
    styleUrls: ['./manual-dialog.component.scss']
})
export class ManualDialogComponent implements OnDestroy {
    private pageEventSubscription: Subscription;

    public manualHtml: SafeHtml | undefined;
    public showManual = false;
    public isLoading = false;

    constructor(manualService: ManualService) {
        this.pageEventSubscription = manualService.pageEvent.subscribe(event => {
            switch (event.status) {
                case 'hide':
                    this.manualHtml = undefined;
                    this.showManual = false;
                    break;

                case 'loading':
                    this.manualHtml = undefined;
                    this.showManual = true;
                    this.isLoading = true;
                    break;

                case 'show':
                    this.manualHtml = event.html;
                    this.showManual = true;
                    this.isLoading = false;
                    break;
            }
        });
    }

    ngOnDestroy() {
        this.pageEventSubscription.unsubscribe();
    }
}
