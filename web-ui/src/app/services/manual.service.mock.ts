import { Injectable } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { PageManualEvent } from './manual.service';

@Injectable()
export class ManualServiceMock {
    private behavior = new BehaviorSubject<PageManualEvent>({ status: 'hide' });
    public pageEvent = this.behavior.asObservable();

    public constructor(private domSanitizer: DomSanitizer) {
    }

    public closePage() {
        this.behavior.next({ status: 'hide' });
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
            status: 'show'
        });
    }
}
