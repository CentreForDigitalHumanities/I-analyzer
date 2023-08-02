import { Component, Input } from '@angular/core';

import { CorpusField, FoundDocument, Corpus } from '../models/index';
import { faBook, faImage } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent {

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    @Input()
    public corpus: Corpus;

    @Input()
    public documentTabIndex: number;


    tabIcons = {
        text: faBook,
        scan: faImage,
    };

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

    isUrlField(field: CorpusField) {
        return field.name === 'url' || field.name.startsWith('url_');
    }
}
