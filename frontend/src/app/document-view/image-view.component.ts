import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnInit {
    @Input() public imgPath: string;

    @ViewChild('zoomedImage') zoomedImage: ElementRef;
    @ViewChild('sourceImage') public sourceImage: ElementRef;

    public backgroundImageStyle: SafeStyle;
    public top: number;
    public left: number;
    public backgroundPosition: string;
    private lensWidth: number = 40;
    
    constructor(private sanitizer: DomSanitizer) { }

    ngOnInit() {
        this.backgroundImageStyle = this.setZoomImage(this.imgPath);
    }

    @HostListener('mouseenter') onMouseEnter() {
        console.log(this.sourceImage.nativeElement.getBoundingClientRect());
    }

    @HostListener('mouseleave') onMouseLeave() {
    }

    @HostListener('mousemove', ['$event']) onmousemove(event: MouseEvent) {
        let sourceImageRect = this.sourceImage.nativeElement;//.getBoundingClientRect();
        this.left = event.clientX - this.lensWidth/2;
        //console.log(event.clientY, sourceImageRect.offsetTop, sourceImageRect.scrollTop);
        this.top = event.clientY - sourceImageRect.offsetTop - this.lensWidth;
        this.backgroundPosition = "-"+event.offsetX.toString()+"px -"+event.offsetY.toString()+"px";
    }

    setZoomImage(path: string) {
        let backgroundImage = path;
        // sanitize the style expression
        const style = `background-image: url(${backgroundImage})`;
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
  

}
