import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

// import { DocumentContainerDirective } from '../document-view/document-container.directive';
import { DocumentViewComponent } from '../document-view/document-view.component';

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
    private margins: number = 5; // zoom image and lens borders
    private srcMargins: number = 10; // src image border and margin
    private mouseY: number;
    private zoomFactor: number = 300 / this.lensWidth; // size of zoomed image, divided by lens size
    private sourceImageEl: any;
    private sourceImageRect: any;
    
    constructor(private sanitizer: DomSanitizer, private _documentDialog: DocumentViewComponent) { } //DocumentContainerDirective) { }

    ngOnChanges() {
        this.backgroundImageStyle = this.setZoomImage(this.imgPath); 
    }

    onScroll() {
        this._documentDialog.getScroll().then( scroll => {
            this.top = this.mouseY + scroll;
        });
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
        this.left = event.clientX - this.lensWidth/2 - this.srcMargins;
        this.mouseY = event.clientY - this.lensWidth/2 - this.sourceImageEl.offsetTop + this.srcMargins + this.margins;
        this.onScroll();
    }

    setZoomImage(path: string) {
        let backgroundImage = path;
        // sanitize the style expression
        const style = `background-image: url(${backgroundImage})`;
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
  

}
