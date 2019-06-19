import { Component, Input, OnChanges, ElementRef } from '@angular/core';
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

    public imgNotFound: boolean;
    public imgPath: string;

    constructor(private el: ElementRef) { }

    ngOnChanges() {
        if (this.corpus.scan_image_type=="png") {
            if (this.document.fieldValues.image_path){
                this.imgPath = "/api/get_scan_image/" + this.corpus.index + '/' + this.document.fieldValues.image_path;
                this.imgNotFound = false;
            }
            else {
                this.imgPath = undefined;
                this.imgNotFound = true;
            }
        }
    }

    async getScroll() {
        // need to know how far the dialog has been scrolled for zoom
        // document view's parent has the relevant scrollTop value
        return this.el.nativeElement.parentElement.scrollTop;
    }

}
