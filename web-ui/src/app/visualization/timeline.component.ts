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
        key_as_string?: string
    }[];
    @Input() visualizedField;
    @Input() chartElement;

    public xScale: d3.ScaleTime<any, any>;
    //private xDomain: [Date, Date];
	private zoom: any;
    private view: any;
    private years: Array<KeyFrequencyPair>;
    private months: Array<KeyFrequencyPair>;
    private weeks: Array<KeyFrequencyPair>;
    private currentTimeCategory: string;
    private selectedData: Array<KeyFrequencyPair>;
    

    ngOnChanges(changes: SimpleChanges) {  
    	if (this.searchData && this.visualizedField) {
            // date fields are returned with keys containing identifiers by elasticsearch
            // replace with string representation, contained in 'key_as_string' field
            this.selectedData = this.searchData;
            this.calculateDomains();
            this.prepareTimeline();
            this.setupTimeData();
            console.log(this.selectedData);
            //this.createChart(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
            //this.drawChartData();
            //this.setupZoomBehaviour();
            
            if (changes['visualizedField'] != undefined) {
                this.createChart(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
                this.drawChartData();
                this.setupZoomBehaviour();
                this.setScaleY();
            }
        }
    }               

    prepareTimeline() {
        this.xDomain = d3.extent(this.selectedData, d => new Date(d.key_as_string));
      	this.xScale = d3.scaleTime()
          .domain(this.xDomain)
          .range([0, this.width]);
        this.xBarWidth = 5;
    }               

    setupTimeData() {
    	this.searchData.forEach(cat => {
            return cat.date = new Date(cat.key_as_string)
        });
        this.years = this.rearrangeDates(_.groupBy(this.searchData, item => d3.timeYear(item.date)));
        this.months = this.rearrangeDates(_.groupBy(this.searchData, item => d3.timeMonth(item.date)));
        this.weeks = this.rearrangeDates(_.groupBy(this.searchData, item => d3.timeWeek(item.date)));
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
            this.selectedData = this.searchData;
            this.currentTimeCategory = 'days';
        }
    }

    drawChartData() {
        /**
        * bind data to chart, remove or update existing bars, add new bars
        */

        const update = this.chart.selectAll('.bar')
            .data(this.selectedData);

        // remove exiting bars
        update.exit().remove();

        // update existing bars
        this.chart.selectAll('.bar').transition()
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
          .transition()
          .delay((d, i) => i * 10)
          .attr('y', d => this.yScale(d.doc_count))
          .attr('height', d => this.height - this.yScale(d.doc_count));
    }

    setupZoomBehaviour() {
    	this.zoom = d3.zoom()
          .scaleExtent([1, Infinity])
          .translateExtent([[0, 0], [this.width, this.height]])
          .extent([[0, 0], [this.width, this.height]])
          .on("zoom", this.zoomed.bind(this));
        this.view = this.svg.append("g").append("rect")
          .attr("class", "zoom")
          .attr("width", this.width)
          .attr("height", this.height)
          .style("fill", "none")
          .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
     	this.svg.call(this.zoom);
    }              	

    zoomed() {
        var t = d3.event.transform;
        var newScale = t.rescaleX(this.xScale);
        var xExtent = newScale.domain();
        // if there are more than 30 categories within the current x extent,
        // group into bigger time level (e.g. days -> weeks)
        var selection = this.selectedData.filter( d => d.date >= xExtent[0] && d.date <= xExtent[1] );
        if (selection.length > 5) {
            this.biggerTimeCategory(xExtent[0], xExtent[1]);
            this.drawChartData();
            console.log(this.currentTimeCategory);
        }
        // if there are less than 10 categories within the current x extent,
        // group into smaller time level (e.g. months -> weeks)
        else if (selection.length < 2) {
            this.smallerTimeCategory(xExtent[0], xExtent[1]);
            this.drawChartData();
        }  
        this.xAxis.call(this.xAxisClass.scale(newScale));
        //console.log(t.toString());
        this.chart.selectAll('.bar').attr("transform", "translate(" + t.x + "," + t.y + ") scale(" + t.k + ")");
    }               

    rearrangeDates(grouping) {
        if (grouping) {
            let newData = _.map( grouping, (value, key) => {
                    let item = <KeyFrequencyPair>{};
                    item.key = key;
                    item.doc_count = _.sumBy(value, d => d.doc_count);
                    return item;
            });       
            return newData;
        }
    }               

    smallerTimeCategory(lowerBound, upperBound) {
        switch(this.currentTimeCategory) {
            case 'years':
                this.selectedData = this.months.filter( d => d.key >= lowerBound && d.key <= upperBound );
                this.currentTimeCategory = 'months';
                break;
            case 'months':
                this.selectedData = this.weeks.filter( d => d.key >= lowerBound && d.key <= upperBound );
                this.currentTimeCategory = 'weeks';
                break;
            case 'weeks':
                this.selectedData = this.searchData.filter( d => d.key >= lowerBound && d.key <= upperBound )
                this.currentTimeCategory = 'days';
                break;
            case 'days':
                //this.selectedData = this.searchData.filter( d => d.key >= lowerBound && d.key <= upperBound );
                break;
        }
    }
        
    biggerTimeCategory(lowerBound, upperBound) {
        switch(this.currentTimeCategory) {
            case 'days':
                this.selectedData = this.weeks.filter( d => d.key >= lowerBound && d.key <= upperBound );
                this.currentTimeCategory = 'weeks';
                break;
            case 'weeks':
                this.selectedData = this.months.filter( d => d.key >= lowerBound && d.key <= upperBound );
                this.currentTimeCategory = 'months';
                break;
            case 'months':
                this.selectedData = this.years.filter( d => d.key >= lowerBound && d.key <= upperBound );
                this.currentTimeCategory = 'years';
                break;
            case 'years':
                //this.selectedData = this.years.filter( d => d.key >= lowerBound && d.key <= upperBound );
                break;
        }
    }
}

type KeyFrequencyPair = {
    key: string;
    doc_count: number;
    key_as_string?: string;
}
