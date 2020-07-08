import { Component, Input } from '@angular/core';

import { CorpusField, FoundDocument, Corpus } from '../models/index';


@Component({
    selector: 'ia-document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent {

    public get contentFields() {
        return this.fields.filter(field => !field.hidden && field.displayType == 'text_content');
    }

    public get propertyFields() {
        return this.fields.filter(field => !field.hidden && field.displayType != 'text_content');
    }

    @Input()
    public fields: CorpusField[] = [];

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    @Input()
    public corpus: Corpus;

    @Input()
    public documentTabIndex: number;

    public imgNotFound: boolean;
    public imgPath: string;
    public media: string[];
    public allowDownload: boolean;
    public mediaType: string;

    constructor() { }
}
