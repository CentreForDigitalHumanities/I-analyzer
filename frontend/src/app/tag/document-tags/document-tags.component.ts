import { Component, Input, OnInit } from '@angular/core';
import { FoundDocument, Tag } from '../../models';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { first, map, mergeMap } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'ia-document-tags',
  templateUrl: './document-tags.component.html',
  styleUrls: ['./document-tags.component.scss']
})
export class DocumentTagsComponent implements OnInit {
    @Input() document: FoundDocument;

    faTimes = faTimes;
    faPlus = faPlus;

    showAddNew = false;

    constructor() { }

    ngOnInit(): void {
    }

    addTag(tagId: number) {
        this.document.addTag(tagId);
    }

    removeTag(tag: Tag) {
        this.document.removeTag(tag.id);
    }
}
