import { Component, Input, OnChanges, ViewChild } from '@angular/core';

import { FoundDocument } from '../models';
import { ImageViewerComponent } from 'ng2-image-viewer';

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

    @ViewChild('app-image-viewer') private imageViewer: ImageViewerComponent;

    public downloadPath: string; // optional: downloadable content may differ from displayed content
    
    constructor() { }

    ngOnChanges() {
        this.downloadPath = this.document.fieldValues['image_path'];
        this.imageViewer.showImage();
    }
}
