import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

// import { DocumentContainerDirective } from '../document-view/document-container.directive';
import { DocumentViewComponent } from '../document-view/document-view.component';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnInit {
    @Input() public imgPath: string;

    @ViewChild('sourceImage') public sourceImage: ElementRef;

    public backgroundImageStyle: SafeStyle;
    public top: number;
    public left: number;
    public topPos: string;
    public leftPos: string;
    public backgroundPosition: string;
    public backgroundSize: string;
    public zoomVisible: string = 'hidden';
    private lensWidth: number = 40;
    private dialogScroll: number = 0;
    private zoomFactor = 300 / 40; // size of zoomed image, divided by lens size
    private sourceImageEl: any;
    private sourceImageRect: any;
    
    constructor(private sanitizer: DomSanitizer, private _documentDialog: DocumentViewComponent) { } //DocumentContainerDirective) { }

    ngOnInit() {
        this.backgroundImageStyle = this.setZoomImage(this.imgPath); 
    }

    onMouseMove(event: MouseEvent) {
        this.sourceImageEl = this.sourceImage.nativeElement;
        this.sourceImageRect = this.sourceImageEl.getBoundingClientRect();
        this.backgroundSize = (this.sourceImageRect.width * this.zoomFactor).toString()+"px " + 
            (this.sourceImageRect.height * this.zoomFactor).toString()+"px";
        this.backgroundPosition = "-"+(event.offsetX * this.zoomFactor - this.zoomFactor * this.lensWidth/2).toString()+"px -"+
            (event.offsetY * this.zoomFactor - this.zoomFactor * this.lensWidth/2).toString()+"px";
        this._documentDialog.getScroll().then( scroll => {
            this.dialogScroll = scroll;
            this.left = event.clientX - this.lensWidth/2;
            this.top = event.clientY - this.lensWidth - this.sourceImageEl.offsetTop + this.dialogScroll;
        });
    }

    setZoomImage(path: string) {
        let backgroundImage = path;
        // sanitize the style expression
        const style = `background-image: url(${backgroundImage})`;
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
  

}
