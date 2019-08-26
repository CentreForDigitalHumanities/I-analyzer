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

    @Input()
    private tabIndex: number;

    public index: number;
    public imgNotFound: boolean;
    public imgPath: string;
    public media: string[];
    public allowDownload: boolean;
    public mediaType: string;

    constructor(private apiService: ApiService) { }

    ngOnChanges(changes: SimpleChanges) {
        this.index = this.tabIndex;
        if (changes.corpus) {
            this.media = undefined;
            this.allowDownload = this.corpus.allow_image_download;
            this.mediaType = this.corpus.scan_image_type;
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

    public tabChange(event) {
        this.index = event.index;
    }

}
