import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";

import { BarChartComponent } from './barchart.component';

@Component({
  selector: 'ia-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent extends BarChartComponent implements OnChanges {
    @Input('searchData') searchData: {
        key: any,
        doc_count: number,
        key_as_string: string
    }[];
    @Input() visualizedField;
    @Input() chartElement;

    public xScale: d3.ScaleTime<any, any>;
    //private xDomain: [Date, Date];
	private zoom: any;
    private view: any;

    private brush: any;
    idleTimeout: number;
    idleDelay: number;

    private years: Array<DateFrequencyPair>;
    private months: Array<DateFrequencyPair>;
    private weeks: Array<DateFrequencyPair>;
    private days: Array<DateFrequencyPair>;
    private currentTimeCategory: string;
    private selectedData: Array<DateFrequencyPair>;
    private histogram: any;

    

    ngOnChanges(changes: SimpleChanges) {  
    	if (this.searchData && this.visualizedField) {
            // date fields are returned with keys containing identifiers by elasticsearch
            // replace with string representation, contained in 'key_as_string' field
            //this.selectedData = this.searchData;
            //this.setupTimeData();
            this.calculateDomains();
            this.prepareTimeline();
            
            //this.createChart(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
            //this.drawChartData();
            //this.setupZoomBehaviour();
            
            if (changes['visualizedField'] != undefined) {
                this.createChart(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
                this.setScaleY();
                this.drawChartData(this.selectedData);
                //this.setupZoomBehaviour();
                this.setupBrushBehaviour();
            }
        }
    }               

    prepareTimeline() {
        this.selectedData = this.formatTimeData();
        console.log(this.selectedData);

        this.xDomain = d3.extent(this.selectedData, d => d.date);
      	this.xScale = d3.scaleTime()
          .domain(this.xDomain)
          .rangeRound([0, this.width])
          .nice();

        this.histogram = d3.histogram()
          .value( d => d.date )
          .domain(this.xScale.domain())
          .thresholds(this.xScale.ticks(d3.timeWeek));

        this.currentTimeCategory = 'weeks'

    }

    formatTimeData() {
        let outData = this.searchData.map(cat => {
            let out: DateFrequencyPair = {};
            out.date = new Date(cat.key_as_string);
            out.doc_count = cat.doc_count;
            return out;
        });
        return outData;
    }               

    setupTimeData() {
    	this.selectedData = this.formatTimeData()
        this.years = this.rearrangeDates(_.groupBy(this.selectedData, item => d3.timeYear(item.date)));
        this.months = this.rearrangeDates(_.groupBy(this.selectedData, item => d3.timeMonth(item.date)));
        this.weeks = this.rearrangeDates(_.groupBy(this.selectedData, item => d3.timeWeek(item.date)));
        this.days = this.selectedData;
        if (this.months.length>30) {
            this.selectedData = this.years;
            this.currentTimeCategory = 'years';
        }
        else if (this.weeks.length>30) {
            this.selectedData = this.months;
            this.currentTimeCategory = 'months';
        }
        else if (this.searchData.length>30) {
            this.selectedData = this.weeks;
            this.currentTimeCategory = 'weeks';
        }
        else {
            this.selectedData = this.days;
            this.currentTimeCategory = 'days';
        }
    }

    drawChartData(inputData) {
        /**
        * bind data to chart, remove or update existing bars, add new bars
        */

        let bins = this.histogram(inputData);
        bins.forEach( d => {
            if (d.length!=0) {
                d.doc_count = _.sumBy(d, item => item.doc_count);
            }
            else {
                d.doc_count = 0;
            }
        });

        console.log(bins);

        const update = this.chart.selectAll('.bar')
            .data(bins);

        // remove exiting bars
        update.exit().remove();

        this.yDomain = [0, d3.max(bins.map( d => d.doc_count ))];
        console.log(this.yDomain);
        this.yScale.domain(this.yDomain);
        this.yAxis.call(this.yAxisClass);

        // update existing bars
/*        this.chart.selectAll('.bar').transition()
          .attr('x', d => this.xScale(d.date))
          .attr('y', d => this.yScale(d.doc_count))
          .attr('width', this.xBarWidth)
          .attr('height', d => this.height - this.yScale(d.doc_count));

        // add new bars
        update
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => this.xScale(d.date))
          .attr('width', this.xBarWidth)
          .attr('y', d => this.yScale(0)) //set to zero first for smooth transition
          .attr('height', 0)
          .transition().duration(750)
          .delay((d, i) => i * 10)
          .attr('y', d => this.yScale(d.doc_count))
          .attr('height', d => this.height - this.yScale(d.doc_count));*/

          this.chart.selectAll('.bar').transition()
          .attr('x', d => this.xScale(d.x0))
          .attr('y', d => this.yScale(d.doc_count))
          .attr('width', d => this.xScale(d.x1) - this.xScale(d.x0) -1)
          .attr('height', d => this.height - this.yScale(d.doc_count));

        // add new bars
        update
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => this.xScale(d.x0))
          .attr('width', d => this.xScale(d.x1) - this.xScale(d.x0) -1)
          .attr('y', d => this.yScale(0)) //set to zero first for smooth transition
          .attr('height', 0)
          .transition().duration(750)
          .delay((d, i) => i * 10)
          .attr('y', d => this.yScale(d.doc_count))
          .attr('height', d => this.height - this.yScale(d.doc_count));
    }

    setupBrushBehaviour() {
        this.brush = d3.brushX().on("end", this.brushended.bind(this));
        this.idleDelay = 350;

        this.svg.append("g")
          .attr("class", "brush")
          .call(this.brush);
    }
  
    brushended() {
        let s = d3.event.selection;
        if (!s) {
            if (!d3.event.sourceEvent.selection) {
                if (!this.idleTimeout) return this.idleTimeout = setTimeout(this.idled, this.idleDelay);
                this.xScale.domain(this.xDomain);
                this.prepareTimeline();
                this.drawChartData(this.selectedData);
            }
                      
        } else {
            this.xScale.domain([s[0], s[1]].map(this.xScale.invert, this.xScale));
            this.svg.select(".brush").call(this.brush.move, null);
        }
        this.zoomBrush();
    }

    idled() {
        this.idleTimeout = null;
    }

    zoomBrush() {
        let t = this.svg.transition().duration(750);
        this.xAxis.transition(t).call(this.xAxisClass);

        let xExtent = this.xScale.domain();
        let selection = this.selectedData.filter( d => d.date >= xExtent[0] && d.date <= xExtent[1] );
        if (selection.length < 10 && this.currentTimeCategory!='days') {
            // rearrange data to look at a smaller time category
            this.adjustTimeCategory();
            this.drawChartData(selection);
        }
        else {
            this.chart.selectAll('.bar')
              .transition().duration(750)
              .attr('x', d => this.xScale(d.x0))
              .attr('width', d => this.xScale(d.x1) - this.xScale(d.x0) -1);
              //.attr('y', d => this.yScale(d.doc_count));
        }
    }

    zoomOut() {
        this.prepareTimeline();
        this.drawChartData();
    }

    rearrangeDates(grouping) {
        if (grouping) {
            let newData = _.map( grouping, (value, date) => {
                let item: DateFrequencyPair = {};
                item.date = new Date(date);
                item.doc_count = _.sumBy(value, d => d.doc_count);
                return item;
            });       
            return newData;
        }
    }               

    adjustTimeCategory() {
        switch(this.currentTimeCategory) {
            case 'years':
                //this.selectedData = this.months.filter( d => d.date >= lowerBound && d.date <= upperBound );
                this.currentTimeCategory = 'months';
                break;
            case 'months':
                //this.selectedData = this.weeks.filter( d => d.date >= lowerBound && d.date <= upperBound );
                this.currentTimeCategory = 'weeks';
                break;
            case 'weeks':
                //this.selectedData = this.days.filter( d => d.date >= lowerBound && d.date <= upperBound )
                this.histogram.thresholds(this.xScale.ticks(d3.timeDay));
                this.currentTimeCategory = 'days';
                break;
            case 'days':
                break;
        }
    }
        
}

type DateFrequencyPair = {
    date: Date;
    doc_count: number;
}
