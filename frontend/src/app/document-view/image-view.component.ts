import { Component, Input, OnChanges } from '@angular/core';

import { FoundDocument } from '../models';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnChanges {
    @Input() public imagePaths: string[];
    @Input() public mediaType: string;
    @Input() public allowDownload: boolean;
    @Input() public document: FoundDocument;

    public downloadPath: string; // optional: downloadable content may differ from displayed content
    
    constructor() { }

    ngOnChanges() {
        this.downloadPath = this.document.fieldValues['image_path'];
    }
}
