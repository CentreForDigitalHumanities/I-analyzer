import { Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { BehaviorSubject } from 'rxjs';

import { NgxMdService } from 'ngx-md';
import { ApiService } from "./api.service";

import { Corpus } from '../models/index';

@Injectable()
export class DialogService {
    private behavior = new BehaviorSubject<DialogPageEvent>({ status: 'hide' });
    private manifest: Promise<ManualPageMetaData[]> | undefined;

    public pageEvent = this.behavior.asObservable();

    public constructor(
        private domSanitizer: DomSanitizer,
        private markdownService: NgxMdService,
        private apiService: ApiService) {
    }

    public closePage() {
        this.behavior.next({ status: 'hide' });
    }

    public async getManualPage(identifier: string) {
        let path = this.getLocalizedPath(`${identifier}.md`);
        let pagePromise = fetch(path).then(response => this.parseResponse(response));

        let html = await pagePromise;
        let manifest = await this.getManifest();
        let title = manifest.find(page => page.id == identifier).title;

        return { html, title };
    }

    public getManifest(): Promise<ManualPageMetaData[]> {
        if (this.manifest) {
            return this.manifest;
        }

        let path = this.getLocalizedPath(`/manifest.json`);
        return this.manifest = fetch(path).then(response => response.json());
    }

    /**
     * Requests that a manual page should be shown to the user.
     * @param identifier Name of the page
     */
    public async showManualPage(identifier: string) {
        this.behavior.next({
            status: 'loading'
        });
        let { html, title } = await this.getManualPage(identifier);

        this.behavior.next({
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

    public async showDescriptionPage(corpus: Corpus) {
        const description = this.apiService.corpusdescription({filename: corpus.descriptionpage, corpus: corpus.name});
        this.showDocumentation(
            corpus.name,
            corpus.title,
            description,
        );
    }

    /**
     * show a string with markdown documentation
     */
    public async showDocumentation(identifier: string, title: string, documentation: string| Promise<string>) {
        this.behavior.next({
            status: 'loading'
        });

        const doc = await documentation;
        const html = await this.markdownService.compile(doc);
        this.behavior.next({
            identifier: identifier,
            html: html,
            title: title,
            status: 'show',
            footer: null
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

export type DialogPageEvent =
  {
    status: 'loading'
  } | {
    status: 'show',
    identifier: string,
    title: string,
    html: SafeHtml
    footer: {
      routerLink: string[],
      buttonLabel: string
    }
  } | {
    status: 'hide'
  }


export type ManualPageMetaData = {
    title: string,
    id: string
}
