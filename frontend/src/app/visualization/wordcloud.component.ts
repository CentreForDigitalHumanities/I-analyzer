import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';

import * as cloud from 'd3-cloud';
import * as d3 from 'd3';

import { AggregateData } from '../models/index';
import { DialogService } from '../services/index';

@Component({
    selector: 'ia-wordcloud',
    templateUrl: './wordcloud.component.html',
    styleUrls: ['./wordcloud.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class WordcloudComponent implements OnChanges, OnInit {
    @ViewChild('wordcloud', { static: true }) private chartContainer: ElementRef;
    @Input('searchData') public significantText: AggregateData;
    @Input('disableLoadMore') public disableLoadMore: boolean;
    @Input('asTable') public asTable: boolean;
    @Output('loadMore')
    public loadMoreDataEmitter = new EventEmitter();

    private width = 600;
    private height = 400;
    private scaleFontSize = d3.scaleLinear();
    public isLoading = false;

    private chartElement: any;
    private svg: any;

    constructor(private dialogService: DialogService) { }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        this.chartElement = this.chartContainer.nativeElement;
        const significantText = changes.significantText.currentValue;
        if (significantText !== undefined && significantText !== changes.significantText.previousValue) {
            this.isLoading = false;
            d3.selectAll('svg').remove();
            const inputRange = d3.extent(significantText.map(d => d.doc_count)) as number[];
            const outputRange = [20, 80];
            this.scaleFontSize.domain(inputRange).range(outputRange);
            this.drawWordCloud(significantText);
        }
    }

    showWordcloudDocumentation() {
        this.dialogService.showManualPage('wordcloud');
    }

    loadMoreData() {
        this.loadMoreDataEmitter.emit();
        this.isLoading = true;
    }

    drawWordCloud(significantText: AggregateData) {
        this.svg = d3.select(this.chartElement)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        const chart = this.svg
            .append("g")
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")")
            .selectAll("text");

        const fill = d3.scaleOrdinal(d3.schemeCategory10);

        const layout = cloud()
            .size([this.width, this.height])
            .words(significantText)
            .padding(5)
            .rotate(function () { return ~~(Math.random() * 2) * 90; })
            .font("Impact")
            .fontSize(d => this.scaleFontSize((d.doc_count)))
            .on("end", function (words) {
                // as d3 overwrites the "this" scope, this function is kept inline (cannot access the dom element otherwise)
                chart
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function (d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .style("fill", function (d, i) { return fill(i); })
                    .attr("text-anchor", "middle")
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(d => d.key);
            });

        layout.start();
    }

}
