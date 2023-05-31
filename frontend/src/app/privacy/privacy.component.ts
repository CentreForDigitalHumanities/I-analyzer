import { Component, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { DialogService, UserService } from '../services/index';

@Component({
    selector: 'ia-privacy',
    templateUrl: './privacy.component.html',
    styleUrls: ['./privacy.component.scss'],
})
export class PrivacyComponent implements OnInit {
    public title: string | undefined;
    public manualHtml: SafeHtml | undefined;
    constructor(private dialogService: DialogService) {}

    ngOnInit() {
        this.dialogService.getManualPage('privacy').then((page) => {
            this.manualHtml = page.html;
            this.title = page.title;
        });
    }
}
