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
    @ViewChild('term-frequency') private termFreqContainer: ElementRef;
    @Input() searchData: AggregateResult[];
    @Input() visualizedField;
    @Input() asPercent: boolean = false;

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
            this.rescaleY(this.asPercent);
            this.createChart(this.visualizedField.displayName);
            this.drawChartData(this.searchData);
        }

        //listen for changes in 'asPercent'
        else if (changes['asPercent'] != undefined) {
            if (changes['asPercent'].previousValue != changes['asPercent'].currentValue) {
                this.rescaleY(this.asPercent);
            }
        }
        this.prepareTermFrequency();
    }

    prepareTermFrequency() {
        this.xDomain = this.searchData.map(d => d.key);
        if (typeof this.xDomain[0]==="number") {
            // set up a linear rather than ordinal scale
            let xDomain = [d3.min(this.xDomain)-1, d3.max(this.xDomain)+1]
            this.xScale = d3.scaleLinear().domain(xDomain).rangeRound([0, this.width]);
            // width of canvas, divided by potential datapoints
            this.xBarWidth = this.width / (this.xScale.domain()[1]-this.xScale.domain()[0])-1;
            this.correction = this.xBarWidth/2;
        }
        else {
            this.xScale = d3.scaleBand().domain(this.xDomain).rangeRound([0, this.width]).padding(.1);
            this.xBarWidth = this.xScale.bandwidth();
            this.correction = 0;
        }
        this.yMax = d3.max(this.searchData.map(d => d.doc_count));
        this.totalCount = _.sumBy(this.searchData, d => d.doc_count);
    }

    drawChartData(inputData) {
        /**
        * bind data to chart, remove or update existing bars, add new bars
        */
        const update = this.chart.selectAll('.bar')
            .data(inputData);

        // remove exiting bars
        update.exit().remove();

        // update existing bars
        this.chart.selectAll('.bar').transition()
            .attr('x', d => this.xScale(d.key))
            .attr('y', d => this.yScale(d.doc_count))
            .attr('width', this.xBarWidth)
            .attr('height', d => this.height - this.yScale(d.doc_count));

        // add new bars
        update
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.key))
            .attr('width', this.xBarWidth)
            .attr('y', this.yScale(0)) //set to zero first for smooth transition
            .attr('height', 0)
            .transition().duration(750)
            .delay((d, i) => i * 10)
            .attr('y', d => this.yScale(d.doc_count))
            .attr('height', d => this.height - this.yScale(d.doc_count));
    }


}
