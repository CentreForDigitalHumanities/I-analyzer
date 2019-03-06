import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';

import * as cloud from 'd3-cloud';
import * as d3 from 'd3';

import { AggregateData } from '../models/index';
import { DialogService } from '../services/index';
import { log } from 'util';

@Component({
    selector: 'ia-wordcloud',
    templateUrl: './wordcloud.component.html',
    styleUrls: ['./wordcloud.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class WordcloudComponent implements OnChanges, OnInit {
    @ViewChild('wordcloud') private chartContainer: ElementRef;
    @Input('searchData') public significantText: AggregateData;
    @Input('greyOutLoadMore') public greyOutLoadMore: boolean;
    @Output('loadAll')
    public loadAllDataEmitter = new EventEmitter();

    private width: number = 600;
    private height: number = 400;
    private scaleFontSize = d3.scaleLinear();;
    public isLoading: boolean = false;

    private chartElement: any; 
    private svg: any;

    constructor(private dialogService: DialogService) { }

    ngOnInit() {
       
    }

    ngOnChanges(changes: SimpleChanges) {
        this.chartElement = this.chartContainer.nativeElement;     
        let significantText = changes.significantText.currentValue;
        if (significantText !== undefined && significantText !== changes.significantText.previousValue) {
            this.isLoading = false;
            d3.selectAll('svg').remove();
            let inputRange = d3.extent(significantText.map(d => d.doc_count)) as number[];
            let outputRange = [20, 80];
            this.scaleFontSize.domain(inputRange).range(outputRange);
            this.drawWordCloud(significantText);
        }
    }

    showWordcloudDocumentation() {
        this.dialogService.showManualPage('wordcloud');
    }

    loadAllData() {
        this.loadAllDataEmitter.emit();
        this.isLoading = true;
    }

    drawWordCloud(significantText: AggregateData) {
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
          .fontSize(d => this.scaleFontSize((d.doc_count)))
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
