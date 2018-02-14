import { Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

import { MarkdownService } from 'ngx-md';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class ManualService {
    private behavior = new BehaviorSubject<PageManualEvent>({ status: 'hide' });
    public pageEvent = this.behavior.asObservable();

    public constructor(private domSanitizer: DomSanitizer, private markdownService: MarkdownService) {
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
        let html = await fetch(path).then(response => this.parseResponse(response));
        this.behavior.next({
            html,
            status: 'show'
        });
    }

    private async parseResponse(response: Response) {
        let text = await response.text();
        let html = this.markdownService.compile(text);
        // mark that the output of the markdown service is safe to accept: it can contain style and id attributes,
        // which normally aren't liked by Angular
        return this.domSanitizer.bypassSecurityTrustHtml(html.replace(/<a href=/g, '<a target="_blank" href='));
    }
}

export type PageManualEvent =
    {
        status: 'loading'
    } | {
        status: 'show',
        html: SafeHtml
    } | {
        status: 'hide'
    }
