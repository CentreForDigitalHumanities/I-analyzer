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
        const op = (ids: number[]) => ids.concat([tagId]);
        this.setTags(op);
    }

    removeTag(tag: Tag) {
        const op = (ids: number[]) => ids.filter(id => id !== tag.id);
        this.setTags(op);
    }

    private setTags(operation: (ids: number[]) => number[]) {
        this.document.tags$.pipe(
            first(),
            map(tags => tags.map(tag => tag.id)),
            map(operation),
            mergeMap(ids => this.document.setTags(ids))
        ).subscribe();
    }

}
