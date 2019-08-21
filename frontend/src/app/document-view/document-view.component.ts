import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { CorpusField, FoundDocument, Corpus } from '../models/index';
import { ApiService } from '../services';


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

    public imgNotFound: boolean;
    public imgPath: string;
    public media: string[];
    public allowDownload: boolean;

    constructor(private apiService: ApiService) { }

    ngOnChanges(changes: SimpleChanges) {
        this.media = undefined;
        if (changes.corpus) {
            this.allowDownload = this.corpus.allow_image_download;
        }
        if (changes.document &&  
            changes.document.previousValue != changes.document.currentValue) {
                this.apiService.requestMedia({corpus_index: this.corpus.name, document: this.document}).then( response => {
                    if (response.success) {
                        this.media = response.media;
                    };
                })
        }
    }

}
