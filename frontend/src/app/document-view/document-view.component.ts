import { Component, Input, OnChanges } from '@angular/core';

import { CorpusField, FoundDocument, Corpus, QueryModel } from '../models/index';


@Component({
    selector: 'ia-document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnChanges {

    public get contentFields() {
        return this.corpus.fields.filter(field => !field.hidden && field.displayType === 'text_content');
    }

    public get propertyFields() {
        return this.corpus.fields.filter(field => !field.hidden && field.displayType !== 'text_content');
    }

    @Input()
    public document: FoundDocument;

    @Input()
    public queryModel: QueryModel;

    @Input()
    public corpus: Corpus;

    @Input()
    public documentTabIndex: number;

    public imgNotFound: boolean;
    public imgPath: string;
    public media: string[];
    public allowDownload: boolean;
    public mediaType: string;

    public tabIndex: number;

    constructor() { }

    ngOnChanges() {
        this.tabIndex = this.documentTabIndex || 0;
    }

    changeTabIndex(index: number) {
        this.tabIndex = index;
    }

    isUrlField(field: CorpusField) {
        return field.name === 'url' || field.name.startsWith('url_');
    }

    /**
     * Checks if user has selected fields in the queryModel and whether current field is among them
     * Used to check which fields need to be highlighted
     */
    selectedFieldsContain(field: CorpusField) {
        if (this.queryModel && this.queryModel.searchFields && this.queryModel.searchFields.includes(field)) {
            return true;
        } else if (this.queryModel && !this.queryModel.searchFields) {
            return true;  // if there are no selected fields, return true for all fields
        } else {
            return false;
        }
    }

    stripTags(htmlString: string){
        const parseHTML= new DOMParser().parseFromString(htmlString, 'text/html');
        return parseHTML.body.textContent || '';
      }

    highlightedInnerHtml(field: CorpusField) {
        let highlighted = this.document.fieldValues[field.name];
        if (this.document.highlight && this.document.highlight.hasOwnProperty(field.name) &&
            this.selectedFieldsContain(field)) { // only apply highlights to selected search fields
                for (let highlight of this.document.highlight[field.name]) {
                    const stripped_highlight = this.stripTags(highlight);
                    highlighted = highlighted.replace(stripped_highlight, highlight);
                }
                return highlighted;
            } else {
                return this.document.fieldValues[field.name];
            }
        }
}
