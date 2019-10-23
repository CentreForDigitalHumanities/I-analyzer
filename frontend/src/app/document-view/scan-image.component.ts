import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild, SimpleChanges } from '@angular/core';

import { ImageViewer } from 'iv-viewer';

@Component({
  selector: 'ia-scan-image',
  templateUrl: './scan-image.component.html',
  styleUrls: ['./scan-image.component.scss']
})
export class ScanImageComponent implements AfterViewInit, OnChanges {
    @Input() public imagePaths: string[];
    @Input() public zoomFactor: number;
    
    @ViewChild('imageContainer') public container: ElementRef;

    public viewer: any = null;
    public pageIndex: number = 1;
    public startPage: number;
    public totalPages: number;
    public currentPage: number = 1;


    ngAfterViewInit() {
        this.viewer = new ImageViewer(this.container.nativeElement);
        this.showCurrentImage();    
    }

    ngOnChanges(changes: SimpleChanges) {
        this.totalPages = this.imagePaths.length;
        if (this.viewer) {
            this.showCurrentImage();
            if (changes['zoomFactor']) {
                this.viewer.zoom(this.zoomFactor * 100);
            }
        }
    }

    showCurrentImage() {
        let imgObj = this.imagePaths[this.pageIndex-1];
        this.viewer.load(imgObj, imgObj); //check options section for supported options 
    }

    pageIndexChange(event) {
        this.pageIndex = event;
        this.showCurrentImage();
    }
}
