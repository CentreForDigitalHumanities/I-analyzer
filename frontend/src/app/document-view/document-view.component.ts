import { Component, Input, OnChanges } from '@angular/core';

import { CorpusField, FoundDocument, Corpus } from '../models/index';
import { faBook, faImage } from '@fortawesome/free-solid-svg-icons';
import { Tab } from '../models/ui';

@Component({
    selector: 'ia-document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnChanges {

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    @Input()
    public corpus: Corpus;

    @Input()
    public documentTabIndex: number;

    tabs: Tab[];
    activeTab: string | number;

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

    ngOnChanges() {
        this.tabs = this.getTabs();
        this.activeTab = this.tabs[0].id;
    }

    selectTab(tab: Tab) {
        this.activeTab = tab.id;
    }

    isUrlField(field: CorpusField) {
        return field.name === 'url' || field.name.startsWith('url_');
    }

    getTabs(): Tab[] {
        const fieldTabs: Tab[] = this.contentFields.map(field => ({
            label: field.displayName,
            icon: this.tabIcons.text,
            id: field.name,
        }));

        if (this.showScanTab) {
            const scanTab: Tab = {
                label: 'Scan',
                icon: this.tabIcons.scan,
                id: 'scan'
            };

            return fieldTabs.concat(scanTab);
        } else {
            return fieldTabs;
        }
    }

}
