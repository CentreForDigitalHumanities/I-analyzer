import { Component, Input, OnInit } from '@angular/core';
import { Tag } from '../../models';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'ia-document-tags',
  templateUrl: './document-tags.component.html',
  styleUrls: ['./document-tags.component.scss']
})
export class DocumentTagsComponent implements OnInit {
    @Input() tags: Tag[];

    faTimes = faTimes;
    faPlus = faPlus;

    constructor() { }

    ngOnInit(): void {
    }

}
