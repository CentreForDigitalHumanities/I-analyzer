import { Component, Input, OnChanges } from '@angular/core';
import { CorpusField, FoundDocument, Corpus } from '../models/index';
import { ApiService } from '../services';
import { zipProto } from 'rxjs/operator/zip';


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

    constructor(private apiService: ApiService) { }

    ngOnChanges() {
        if (this.corpus.scan_image_type=="png") {
            this.imgPath = "/api/get_scan_image/" + this.corpus.index + this.document.fieldValues.image_path;
        }
    }

}
