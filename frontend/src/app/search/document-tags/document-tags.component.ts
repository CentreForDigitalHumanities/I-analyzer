import { Component, Input, OnInit } from '@angular/core';
import { Tag } from '../../models';

@Component({
  selector: 'ia-document-tags',
  templateUrl: './document-tags.component.html',
  styleUrls: ['./document-tags.component.scss']
})
export class DocumentTagsComponent implements OnInit {
    @Input() tags: Tag[];

    constructor() { }

    ngOnInit(): void {
    }

}
