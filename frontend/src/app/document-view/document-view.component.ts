import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { CorpusField, FoundDocument, Corpus, QueryModel } from '../models/index';
import { DocumentView } from '../models/document-page';
import * as _ from 'lodash';
import { documentIcons } from '../shared/icons';

@Component({
    selector: 'ia-document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnChanges {

    @Input()
    public document: FoundDocument;

    @Input()
    public queryModel: QueryModel;

    @Input()
    public corpus: Corpus;

    @Input()
    public view: DocumentView;

    documentIcons = documentIcons;

    /** active tab on opening */
    activeTab: string;

    public imgNotFound: boolean;
    public imgPath: string;
    public media: string[];
    public allowDownload: boolean;
    public mediaType: string;

    constructor() { }

    get contentFields() {
        return this.corpus.fields.filter(field => !field.hidden && field.displayType === 'text_content');
    }

    get propertyFields() {
        return this.corpus.fields.filter(field => !field.hidden && field.displayType !== 'text_content');
    }

    get showScanTab() {
        return !!this.corpus.scan_image_type;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.view) {
            this.activeTab = this.tabFromView(this.view);
        }
    }

    /** get the tab from the view mode
     *
     * For "scan" view: select the scan tab if there is one
     * For "content" view: select the first content field
     */
    tabFromView(view: DocumentView): string {
        if (view === 'scan' && this.showScanTab) {
            return 'scan';
        }
        return _.first(this.contentFields)['name'];
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

    formatInnerHtml(field: CorpusField) {
        const fieldValue = this.document.fieldValues[field.name];

        if (_.isEmpty(fieldValue)) {
            return;
        }

        const highlighted = this.highlightedInnerHtml(field);
        return this.addParagraphTags(highlighted);
    }


    highlightedInnerHtml(field: CorpusField) {
        let highlighted = this.document.fieldValues[field.name];
        if (this.document.highlight && this.document.highlight.hasOwnProperty(field.name) &&
            this.selectedFieldsContain(field)) { // only apply highlights to selected search fields
                for (const highlight of this.document.highlight[field.name]) {
                    const stripped_highlight = this.stripTags(highlight);
                    highlighted = highlighted.replace(stripped_highlight, highlight);
                }
                return highlighted;
            } else {
                return this.document.fieldValues[field.name];
            }
        }

    addParagraphTags(content: string) {
        const paragraphs = content.split('\n');
        return paragraphs.map(p => `<p>${p}</p>`).join(' ');
    }
}
