import { Component, OnInit } from '@angular/core';
import { SafeHtml, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { DialogService } from '../services';

@Component({
    selector: 'ia-manual',
    templateUrl: './manual.component.html',
    styleUrls: ['./manual.component.scss']
})
export class ManualComponent implements OnInit {
    public isLoading = false;
    public title: string | undefined;
    public manualHtml: SafeHtml | undefined;

    constructor(
        private dialogService: DialogService,
        private activatedRoute: ActivatedRoute,
        title: Title
    ) {
        title.setTitle('Manual - I-analyzer');
    }

    ngOnInit() {
        // always close any manual dialog when viewing this page
        this.dialogService.closePage();

        this.activatedRoute.paramMap.subscribe(async params => {
            const identifier = params.get('identifier');
            this.isLoading = true;
            const page = await this.dialogService.getManualPage(identifier);
            this.manualHtml = page.html;
            this.title = page.title;

            this.isLoading = false;
        });
    }
}
