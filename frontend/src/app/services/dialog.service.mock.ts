import { Injectable } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { BehaviorSubject } from 'rxjs';

import { DialogPageEvent } from './dialog.service';

@Injectable()
export class DialogServiceMock {
    private behavior = new BehaviorSubject<DialogPageEvent>({ status: 'hide' });
    public pageEvent = this.behavior.asObservable();

    public constructor(private domSanitizer: DomSanitizer) {
    }

    public closePage() {
        this.behavior.next({ status: 'hide' });
    }

    public async getManualPage(identifier: string) {
        let title = 'Test title';
        let html = '<p>This is a test.</p>';
        return { html, title };
    }

    /**
     * Requests that a manual page should be shown to the user.
     * @param identifier Name of the page
     */
    public async showPage(identifier: string) {
        // TODO: in a multilingual application this would need to be modified
        let path = `assets/manual/en-GB/${identifier}.md`;
        this.behavior.next({
            status: 'loading'
        });
        let html = await Promise.resolve('<p>Hello world!</p>');
        this.behavior.next({
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
