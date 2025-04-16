import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Corpus } from '@models';
import { WordmodelsService } from '@services';
import embed from 'vega-embed';

@Component({
    selector: 'ia-local-graph',
    templateUrl: './local-graph.component.html',
    styleUrl: './local-graph.component.scss'
})
export class LocalGraphComponent implements OnChanges {
    @Input({required: true}) corpus!: Corpus;
    @Input({required: true}) queryText!: string;

    @ViewChild('chart') chart!: ElementRef;

    data: any;

    constructor(
        private wordModelsService: WordmodelsService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        this.getData()
    }

    getData() {
        this.wordModelsService.getLocalGraph(
            this.queryText, this.corpus.name, 5
        ).subscribe(this.onDataLoaded.bind(this));
    }

    onDataLoaded(res) {
        this.data = res;
        const spec = res[0]['graph'];
        console.log(spec);
        this.renderChart(spec);
    }

    renderChart(data): void {
        const aspectRatio = 2 / 3;
        const width = this.chart.nativeElement.offsetWidth;
        const height = width * aspectRatio;

        embed(this.chart.nativeElement, data, {
            mode: 'vega',
            renderer: 'canvas',
            width: width,
            height: height,
            actions: false,
            tooltip: true,
        }).catch(error => {
            console.error(error);
        });
    }
}
