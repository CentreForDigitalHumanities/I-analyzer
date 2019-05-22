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

    public backgroundImageStyle: SafeStyle;
    
    constructor(private sanitizer: DomSanitizer) { }

    ngOnInit() {
        this.backgroundImageStyle = this.setZoomImage(this.imgPath);
    }

    @HostListener('mouseenter') onMouseEnter() {
    }

    @HostListener('mouseleave') onMouseLeave() {
        //this.setZoomImage(null);
    }

    @HostListener('mousemove', ['$event']) onmousemove(event: MouseEvent) {
        console.log(event.offsetX, event.offsetY);
    }

    setZoomImage(path: string) {
        let backgroundImage = path;
        // sanitize the style expression
        const style = `background-image: url(${backgroundImage})`;
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
  

}
