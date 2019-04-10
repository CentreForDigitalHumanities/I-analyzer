import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import * as _ from "lodash";

import { AggregateResult } from '../models/index';
import { BarChartComponent } from './barchart.component';

@Component({
  selector: 'ia-term-frequency',
  templateUrl: './term-frequency.component.html',
  styleUrls: ['./term-frequency.component.scss']
})
export class TermFrequencyComponent extends BarChartComponent implements OnInit, OnChanges {
    @ViewChild('termfrequency') private termFreqContainer: ElementRef;
    @Input() searchData: AggregateResult[];
    @Input() visualizedField;
    @Input() asPercent: boolean = false;

    private xBarWidth: number;
    private tooltip: any;
    private mapping: { key: string, index: number, doc_count: number } [];

    ngOnInit() {
    }
    
    ngOnChanges(changes: SimpleChanges) {
        if (this.chartElement == undefined) {
            this.chartElement = this.termFreqContainer.nativeElement;
            this.calculateCanvas();
        }
        // redraw only if searchData changed
        if (changes['searchData'] != undefined && changes['searchData'].previousValue != changes['searchData'].currentValue) {
            this.prepareTermFrequency();
            this.setupYScale();
            this.createChart(this.visualizedField.displayName, this.searchData.length);
            this.rescaleY(this.asPercent);
            this.setupTooltip();
            this.drawChartData();
            this.setupBrushBehaviour();
        }

        //listen for changes in 'asPercent'
        else if (changes['asPercent'] != undefined) {
            if (changes['asPercent'].previousValue != changes['asPercent'].currentValue) {
                this.rescaleY(this.asPercent);
            }
        }
    }

    prepareTermFrequency() {
        if (typeof this.searchData[0].key==="number") {
           this.searchData = _.sortBy(this.searchData, d => d.key);
        }
        this.mapping = this.searchData.map( (d,i) => { 
            let a = {
                key: d.key,
                index: i,
                doc_count: d.doc_count
            };
            return a;
        });
        this.xDomain = [d3.min(this.mapping.map(d => d.index)), d3.max(this.mapping.map(d => d.index))];
        // width of canvas, divided by potential datapoints
        this.xBarWidth = Math.round(this.width / (this.mapping.length + 1));
        this.xScale = d3.scaleLinear().domain(this.xDomain).rangeRound([0, this.width-this.xBarWidth]);
        this.calculateBarWidth(this.mapping.length);
        this.correction = this.xBarWidth/2;
        this.yMax = d3.max(this.searchData.map(d => d.doc_count));
        this.totalCount = _.sumBy(this.searchData, d => d.doc_count);
    }

    calculateBarWidth(numBars) {
        this.xBarWidth = Math.round(this.width / (numBars + 1));
    }

    drawChartData() {
        /**
        * bind data to chart, remove or update existing bars, add new bars
        */
        const update = this.chart.selectAll('.bar')
            .data(this.mapping);
        
        // x axis ticks
        this.xAxis.selectAll('text')
            .data(this.mapping)
            .text( d => d.key)
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)");

        // remove exiting bars
        update.exit().remove();

        this.xAxisClass.tickValues(this.mapping.map(d => d.key)).tickFormat(d3.format("s"));

        // update existing bars
        this.chart.selectAll('.bar').transition()
            .attr('x', d => this.xScale(d.index))
            .attr('y', d => this.yScale(d.doc_count))
            .attr('width', this.xBarWidth)
            .attr('height', d => this.height - this.yScale(d.doc_count));

        // add new bars
        update
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.index))
            .attr('width', this.xBarWidth)
            // .attr('y', this.yScale(0)) //set to zero first for smooth transition
            // .attr('height', 0)
            // .on('mouseover', d => { 
            //     this.tooltip
            //         .text(d.key)
            //         .attr("x", this.xScale(d.key))
            //         .attr("y", this.yScale(d.doc_count))
            //         .style("visibility", "visible");
            //     return this.tooltip })
            //.on("mousemove", () => { return this.tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
            // .on('mouseout', () => { return this.tooltip.style("visibility", "hidden");})
            // .transition().duration(750)
            // .delay((d, i) => i * 10)
            .attr('y', d => this.yScale(d.doc_count))
            .attr('height', d => this.height - this.yScale(d.doc_count))
            .enter().append('span').attr('class', 'tooltiptext').attr('content', d => d.key);
            // .append("title")
            //     .text( d => d.key);
            //     //.attr('data-balloon', d => d.key);

    }

    setupTooltip() {
        this.tooltip = this.chart.append("div")
            .style("position", "absolute")
            .style("z-index", "50")
            //.style("visibility", "hidden")
            .style("background-color", "red")
            .text("a simple tooltip");
    }

    zoomIn() {
        // this.rescaleX();
        let selection = this.mapping.filter( d => d.index >= this.xScale.domain()[0] && d.index <= this.xScale.domain()[1]);
        console.log(selection);
        this.calculateBarWidth(selection.length);
        this.xAxisClass.ticks(selection.length).tickValues(selection.map(d => d.key));
        this.rescaleX();
        this.chart.selectAll('.bar')
            .transition().duration(750)
            .attr('x', d => this.xScale(d.index))
            .attr('y', d => this.yScale(d.doc_count))
            .attr('width', this.xBarWidth);
    }

    zoomOut() {
        this.rescaleX();
        this.drawChartData();
    }

}
