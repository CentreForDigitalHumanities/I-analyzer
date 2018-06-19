import { Component, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { ManualService } from '../services';

@Component({
    selector: 'ia-manual',
    templateUrl: './manual.component.html',
    styleUrls: ['./manual.component.scss']
})
export class ManualComponent implements OnInit {
    public isLoading = false;
    public title: string | undefined;
    public manualHtml: SafeHtml | undefined;

    constructor(private manualService: ManualService, private activatedRoute: ActivatedRoute) {
    }

    ngOnInit() {
        // always close any manual dialog when viewing this page
        this.manualService.closePage();

        this.activatedRoute.paramMap.subscribe(async params => {
            let identifier = params.get('identifier');
            this.isLoading = true;
            let page = await this.manualService.getPage(identifier);
            this.manualHtml = page.html;
            this.title = page.title;

            this.isLoading = false;
        });
    }
}
