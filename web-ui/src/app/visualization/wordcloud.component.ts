import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';

import * as cloud from 'd3-cloud';
import * as d3 from 'd3';

@Component({
    selector: 'ia-wordcloud',
    templateUrl: './wordcloud.component.html',
    styleUrls: ['./wordcloud.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class WordcloudComponent implements OnChanges {
    @ViewChild('wordcloud') private chartContainer: ElementRef;
    @Input('searchData') public significantText: {
        key: string,
        doc_count: number
    }

    private width: number = 600;
    private height: number = 400;

    private chartElement: any; 
    private svg: any;

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        this.chartElement = this.chartContainer.nativeElement;
        let significantText = changes.significantText.currentValue;
        d3.selectAll('svg').remove();
        if (significantText !== undefined && significantText !== changes.significantText.previousValue) {
            this.drawWordCloud(significantText);
        }
    }

    drawWordCloud(significantText: string[]) {
        this.svg = d3.select(this.chartElement)
          .append("svg")
          .attr("width", this.width)
          .attr("height", this.height);
        let chart = this.svg
          .append("g")
          .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")")
          .selectAll("text");   

        let fill = d3.scaleOrdinal(d3.schemeCategory20);
            
        let layout = cloud()
          .size([this.width, this.height])
          .words(significantText)
          .padding(5)
          .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Impact")
          .fontSize(function(d) { return d.doc_count * 20; })
          .on("end", function(words) {
                // as d3 overwrites the "this" scope, this function is kept inline (cannot access the dom element otherwise)
            chart
              .data(words)
              .enter().append("text")
                .style("font-size", function(d) { return d.size + "px"; })
                .style("font-family", "Impact")
                .style("fill", function(d, i) { return fill(i); })
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(d => d.key);
          });   

        layout.start();
    }

}
