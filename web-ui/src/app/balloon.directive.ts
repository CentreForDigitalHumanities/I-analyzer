import { Directive, ElementRef, Input, OnChanges, Renderer } from '@angular/core';

/**
 * Directive for showing styled tooltip balloons.
*/
@Directive({
    selector: '[iaBalloon]'
})
export class BalloonDirective implements OnChanges {
    @Input("iaBalloon")
    public text: string;

    @Input("iaBalloonPosition")
    public position: "up" | "left" | "right" | "down" | "up-left" | "up-right" | "down-left" | "down-right" = "down";

    /**
     * Show or hide the balloon, or show it on hover.
     */
    @Input("iaBalloonVisible")
    public visible: boolean | undefined;

    constructor(private el: ElementRef) {
    }

    ngOnChanges() {
        let element: HTMLElement = this.el.nativeElement;
        element.setAttribute('data-balloon', this.text);
        element.setAttribute('data-balloon-pos', this.position);
        if (this.visible) {
            element.setAttribute('data-balloon-visible', '');
            return;
        }
        else if (this.visible != undefined) {
            element.removeAttribute('data-balloon');
            element.removeAttribute('data-balloon-pos');
        }

        element.removeAttribute('data-balloon-visible');
    }
}
