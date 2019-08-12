import { Component, Input, OnChanges } from '@angular/core';

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
    public pdfData: any;

    constructor(private apiService: ApiService) { }

    ngOnChanges() {
        this.media = undefined;
        this.pdfData = undefined;
        if (this.corpus.scan_image_type && this.corpus.scan_image_type=='application/pdf'){
            this.apiService.requestPdf({corpus_index: this.corpus.name, document: this.document}).then( response => {
                this.pdfData = response;
            })
        }
        else {
            this.apiService.requestImages({corpus_index: this.corpus.name, document: this.document}).then( response => {
                if (response.success) {
                    this.media = response.media;
                }
            })
        }
    }

}
