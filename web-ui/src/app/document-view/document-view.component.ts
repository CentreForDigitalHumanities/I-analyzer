import { Component, Input, OnInit } from '@angular/core';
import { CorpusField, FoundDocument } from '../models/index';

@Component({
    selector: 'document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnInit {
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

    public contentMode: string = 'text';

    constructor() { }

    ngOnInit() {
    }

    toggleContentMode(input) {
        this.contentMode = input;
    }
}
