import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';

import { ImageViewer } from 'iv-viewer';

@Component({
  selector: 'ia-scan-image',
  templateUrl: './scan-image.component.html',
  styleUrls: ['./scan-image.component.scss']
})
export class ScanImageComponent implements AfterViewInit, OnChanges {
    @Input() public imagePaths: string[];
    @ViewChild('imageContainer') public container: ElementRef;

    public viewer: any = null;
    public imageIndex: number = 1;
    public totalPages: number;

    ngAfterViewInit() {
        this.totalPages = this.imagePaths.length;
        this.viewer = new ImageViewer(this.container.nativeElement);
        this.showCurrentImage();
    }

    ngOnChanges() {
        if (this.viewer) {
            this.showCurrentImage();
        }
    }

    showCurrentImage() {
        let imgObj = this.imagePaths[this.imageIndex-1];
        this.viewer.load(imgObj, imgObj); //check options section for supported options 
    }

    clickedPrevious() {
        this.imageIndex = this.imageIndex - 1 > 0? this.imageIndex - 1 : this.totalPages;
        this.showCurrentImage();
    }

    clickedNext() {
        this.imageIndex = this.imageIndex + 1 < this.totalPages? this.imageIndex + 1 : 1;
        this.showCurrentImage();
    }
}
