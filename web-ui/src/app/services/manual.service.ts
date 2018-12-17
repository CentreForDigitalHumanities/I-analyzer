import { Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

import { MarkdownService } from 'ngx-md';
import { DialogService } from "./dialog.service";



@Injectable()
export class ManualService {
    
    private manifest: Promise<ManualPageMetaData[]> | undefined;

    public constructor(
        private domSanitizer: DomSanitizer, 
        private markdownService: MarkdownService,
        private dialogService: DialogService) {
    }

    public closePage() {
        this.dialogService.behavior.next({ status: 'hide' });
    }

    public async getPage(identifier: string) {
        let path = this.getLocalizedPath(`${identifier}.md`);
        let pagePromise = fetch(path).then(response => this.parseResponse(response));

        let [html, manifest] = await Promise.all([pagePromise, this.getManifest()]);
        let title = "Manual: " + manifest.find(page => page.id == identifier).title;

        return { html, title };
    }

    public getManifest(): Promise<ManualPageMetaData[]> {
        if (this.manifest) {
            return this.manifest;
        }

        let path = this.getLocalizedPath(`manifest.json`);
        return this.manifest = fetch(path).then(response => response.json());
    }

    /**
     * Requests that a manual page should be shown to the user.
     * @param identifier Name of the page
     */
    public async showPage(identifier: string) {        
        this.dialogService.behavior.next({
            status: 'loading'
        });
        let { html, title } = await this.getPage(identifier);

        this.dialogService.behavior.next({
            identifier,
            html,
            title,
            status: 'show',
            footer: {
                buttonLabel: 'View in manual',
                routerLink: ['/manual', identifier]
            }
        });
    }

    private getLocalizedPath(fileName: string) {
        // TODO: in a multilingual application this would need to be modified
        return `assets/manual/en-GB/${fileName}`;
    }

    private async parseResponse(response: Response) {
        let text = await response.text();
        let html = this.markdownService.compile(text);
        // mark that the output of the markdown service is safe to accept: it can contain style and id attributes,
        // which normally aren't liked by Angular
        return this.domSanitizer.bypassSecurityTrustHtml(html.replace(/<a href=/g, '<a target="_blank" href='));
    }
}


export type ManualPageMetaData = {
    title: string,
    id: string
}
