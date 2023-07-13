import { Component, Input, OnInit } from '@angular/core';
import { FoundDocument, Tag } from '../../models';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'ia-document-tags',
  templateUrl: './document-tags.component.html',
  styleUrls: ['./document-tags.component.scss']
})
export class DocumentTagsComponent implements OnInit {
    @Input() document: FoundDocument;

    faTimes = faTimes;
    faPlus = faPlus;

    constructor() { }

    ngOnInit(): void {
    }

    addTag(tag: Tag) {
        this.document.addTag(tag);
    }

    removeTag(tag: Tag) {
        this.document.removeTag(tag);
    }

}
