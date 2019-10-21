import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild, SimpleChanges } from '@angular/core';

import { ImageViewer } from 'iv-viewer';
import { ImageViewComponent } from './image-view.component';

@Component({
  selector: 'ia-scan-image',
  templateUrl: './scan-image.component.html',
  styleUrls: ['./scan-image.component.scss']
})
export class ScanImageComponent implements AfterViewInit, OnChanges {
    @Input() public imagePaths: string[];
    @Input() public pageIndex: number;
    @Input() public zoomFactor: number;
    
    @ViewChild('imageContainer') public container: ElementRef;
    @Output('scanReady')
    public scanReadyEmitter = new EventEmitter<{page: number, lastPage: number}>()

    public viewer: any = null;
    public imageIndex: number = 1;
    public totalPages: number;


    ngAfterViewInit() {
        this.totalPages = this.imagePaths.length;
        this.viewer = new ImageViewer(this.container.nativeElement);
        this.scanReadyEmitter.emit({page: this.imageIndex, lastPage: this.totalPages});
        this.showCurrentImage();    
    }

    ngOnChanges(changes: SimpleChanges) {
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
}
