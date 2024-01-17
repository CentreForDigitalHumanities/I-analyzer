import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import * as smoothScroll from 'smoothscroll-polyfill';
smoothScroll.polyfill();
@Directive({
    selector: '[scrollTo]',
})
export class ScrollToDirective {
    constructor(private el: ElementRef, renderer: Renderer2) {
        // wait for the element to have been drawn
        setTimeout(() => {
            window.scrollTo({
                left: 0,
                top: (this.el.nativeElement as HTMLElement).offsetTop,
                behavior: 'smooth',
            });
        }, 0);
    }

    @HostListener('onChange') onChange() {
        scroll();
    }
}
