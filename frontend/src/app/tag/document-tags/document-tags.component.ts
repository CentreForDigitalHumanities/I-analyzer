import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FoundDocument, Tag } from '../../models';
import * as _ from 'lodash';
import { formIcons, actionIcons } from '../../shared/icons';

@Component({
    selector: 'ia-document-tags',
    templateUrl: './document-tags.component.html',
    styleUrls: ['./document-tags.component.scss'],
})
export class DocumentTagsComponent implements OnChanges {
    @Input() document: FoundDocument;

    formIcons = formIcons;
    actionIcons = actionIcons;

    showAddNew = false;

    constructor() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.document) {
            this.showAddNew = false;
        }
    }

    addTag(tag: Tag) {
        this.document.addTag(tag);
    }

    removeTag(tag: Tag) {
        this.document.removeTag(tag);
    }
}
