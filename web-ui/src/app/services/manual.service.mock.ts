import { Injectable } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import {DialogServiceMock} from "./dialog.service.mock";


@Injectable()
export class ManualServiceMock {
    public pageEvent = this.dialogService.behavior.asObservable();

    public constructor(private domSanitizer: DomSanitizer, private dialogService: DialogServiceMock) {
    }

    public closePage() {
        this.dialogService.behavior.next({ status: 'hide' });
    }

    /**
     * Requests that a manual page should be shown to the user.
     * @param identifier Name of the page
     */
    public async showPage(identifier: string) {
        // TODO: in a multilingual application this would need to be modified
        let path = `assets/manual/en-GB/${identifier}.md`;
        this.dialogService.behavior.next({
            status: 'loading'
        });
        let html = await Promise.resolve('<p>Hello world!</p>');
        this.dialogService.behavior.next({
            html: this.domSanitizer.bypassSecurityTrustHtml(html),
            identifier: 'example',
            title: 'Example Title',
            status: 'show',
            footer: {
                buttonLabel: 'test',
                routerLink: ['/manual', identifier]
            }
        });
    }
}
