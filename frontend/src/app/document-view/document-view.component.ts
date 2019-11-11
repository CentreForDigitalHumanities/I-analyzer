import { Component, Input, OnChanges } from '@angular/core';

import { CorpusField, FoundDocument, Corpus } from '../models/index';


@Component({
    selector: 'ia-document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnChanges {

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
    private tabIndex: number;

    public index: number;
    public imgNotFound: boolean;
    public imgPath: string;
    public media: string[];
    public allowDownload: boolean;
    public mediaType: string;

    constructor() { }

    ngOnChanges() {
        this.index = this.tabIndex;
    }

    public tabChange(event) {
        this.index = event.index;
    }

}
