import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ImageViewerComponent } from 'ng2-image-viewer';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnChanges {
    @Input() public imgPath: string;

    @ViewChild('sourceImage') public sourceImage: ElementRef;

    public backgroundImageStyle: SafeStyle;
    public top: number;
    public left: number;
    public topPos: string;
    public leftPos: string;
    private backgroundX: number;
    private backgroundY: number;
    public backgroundPosition: string;
    public backgroundSize: string;
    public zoomVisible: string = 'hidden';
    public lensWidth: number = 92;
    private zoomFactor: number = 300 / this.lensWidth; // size of zoomed image, divided by lens size
    private sourceImageEl: any;
    private sourceImageRect: any;
    public images: string[];
    
    constructor(private sanitizer: DomSanitizer) { }

    ngOnChanges() {
        this.backgroundImageStyle = this.setZoomImage(this.imgPath);
        this.images = [this.imgPath];
        console.log(this.images);
    }

    onMouseMove(event: MouseEvent) {
        this.sourceImageEl = this.sourceImage.nativeElement;
        this.sourceImageRect = this.sourceImageEl.getBoundingClientRect();
        this.backgroundSize = (this.sourceImageRect.width * this.zoomFactor).toString()+"px " + 
            (this.sourceImageRect.height * this.zoomFactor).toString()+"px";
        this.backgroundX = event.offsetX * this.zoomFactor - this.zoomFactor * this.lensWidth/2;
        this.backgroundY = event.offsetY * this.zoomFactor - this.zoomFactor * this.lensWidth/2;
        this.backgroundPosition = "-"+this.backgroundX.toString()+"px -"+
            this.backgroundY.toString()+"px";
        this.left = event.offsetX - this.lensWidth/2;
        this.top =  event.offsetY - this.lensWidth/2;
    }

    setZoomImage(path: string) {
        let backgroundImage = path;
        // sanitize the style expression
        const style = `background-image: url(${backgroundImage})`;
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
  

}
