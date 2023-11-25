import { Component, ElementRef, OnInit } from '@angular/core';
import { View, ViewOptions, parse } from 'vega';

@Component({
    selector: 'ia-vega',
    templateUrl: './vega.component.html',
    styleUrls: ['./vega.component.scss']
})
export class VegaComponent implements OnInit {

    constructor(private el: ElementRef) { }

    ngOnInit(): void {
        const request = fetch('https://vega.github.io/vega/examples/bar-chart.vg.json')
            .then(res => res.json())
            .then(spec => this.render(spec));
    }

    render(spec): Promise<View> {
        const options: ViewOptions = {
            renderer:  'svg',  // renderer (canvas or svg)
            container: '#chart',   // parent DOM container
            hover:     true       // enable hover processing
        };
        const view = new View(
            parse(spec),
            options
        );
        const width = this.el.nativeElement['offsetWidth'] * 0.8;
        const aspectRatio = spec['height'] / spec['width']  || 1;
        view.width(width);
        view.height(width * aspectRatio);
        return view.runAsync();
    }
}
