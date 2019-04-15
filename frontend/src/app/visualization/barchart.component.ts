import { Component } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";
import { Subscription }   from 'rxjs';

import { DataService, SearchService } from '../services/index';

@Component({
    selector: 'ia-barchart',
    templateUrl: './barchart.component.html',
    styleUrls: ['./barchart.component.scss']
})

export class BarChartComponent {
    public yTicks: number = 10;
    public margin = { top: 10, bottom: 120, left: 70, right: 10 };
    public svg: any;
    public chart: any;
    public width: number;
    public height: number;
    public xScale: any; // can be either ordinal or time scale
    public yScale: d3.ScaleLinear<number, number> = d3.scaleLinear();
    public xAxis: d3.Selection<any, any, any, any>;
    public yAxis: d3.Selection<any, any, any, any>;
    public xAxisClass: any;
    public yAxisClass: any;
    public yMax: number;
    public totalCount: number;
    public xDomain: Array<any>;
    public yDomain: Array<number>;
    public yAxisLabel: any;
    public chartElement: any;
    public correction: number = 0;

    public brush: any;
    private idleTimeout: any;
    private idleDelay: number;

    // dataService is needed for pushing filtered data from timeline component
    constructor(public dataService: DataService, public searchService: SearchService){}

    calculateCanvas() {
        this.height = this.chartElement.offsetHeight - this.margin.top - this.margin.bottom;
        this.width = this.chartElement.offsetWidth - this.margin.left - this.margin.right;
    }

    setupYScale() {
        /**
         adjust the y range
         */
        this.yDomain = [0, this.yMax];
        this.yTicks = this.yDomain[1] > 10 ? 10 : this.yMax;
        this.yScale.domain(this.yDomain).range([this.height, 0]);
    }

    rescaleX() {
        let t = this.svg.transition().duration(750);
        this.xAxis.transition(t).call(this.xAxisClass);
        this.xAxis.selectAll('text')
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)");
    }    

    rescaleY(percent: boolean) {
        /**
        * if the user selects percentage / count display,
        * - rescale y values & axis
        * - change axis label and ticks
        */

        this.yDomain = percent ? [0, this.yMax/this.totalCount] : [0, this.yMax];
        this.yScale.domain(this.yDomain);

        let tickFormat = percent ? d3.format(".0%") : d3.format("d");
        this.yAxisClass = d3.axisLeft(this.yScale).ticks(this.yTicks).tickFormat(tickFormat)
        this.yAxis.call(this.yAxisClass);

        // setting yScale back to counts so drawing bars makes sense
        this.yScale.domain([0, this.yMax]);

        let yLabelText = percent ? "Percent" : "Frequency";
        this.yAxisLabel.text(yLabelText);
    }

    /**
     * Creates the chart to draw the data on (including axes and labels).
     */
    createChart(xAxisLabel: string, tickMarks?: number) {
        /**
        * select DOM elements, set up scales and axes
        */
        d3.select('svg').remove();

        this.svg = d3.select(this.chartElement).append('svg')
            .attr('width', this.chartElement.offsetWidth)
            .attr('height', this.chartElement.offsetHeight);

        this.svg.selectAll('g').remove();
        this.svg.selectAll('text').remove();

        // clipPath
        // when zooming, data outside the coordinate system will be masked
        this.svg.append('defs')
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', this.width)
            .attr('height', this.height)
        
        // chart plot area
        this.chart = this.svg.append('g')
            .attr('clip-path', "url(#clip)")
            .attr('class', 'bars')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this.xAxisClass = d3.axisBottom(this.xScale);
        if (typeof this.xDomain[0]==="number") {
            // prevent commas in years, e.g. 1,992
            this.xAxisClass.tickFormat(d3.format(""));
        }
        if (tickMarks) {
            this.xAxisClass.ticks(tickMarks)
        }
        this.xAxis = this.svg.append('g')
            .attr('class', 'axis-x')
            .attr('transform', `translate(${this.margin.left + this.correction}, ${this.margin.top + this.height})`)
            .call(this.xAxisClass);

        // set style of x tick marks
        this.xAxis.selectAll('text')
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)");

        this.yAxis = this.svg.append('g')
            .attr('class', 'axis-y')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale).ticks(this.yTicks).tickFormat(d3.format("d")));
        
        // adding axis labels
        let xLabelText = xAxisLabel;
        let yLabelText = "Frequency";

        this.svg.append("text")
            .attr("class", "xlabel")
            .attr("text-anchor", "middle")
            .attr("x", this.width / 2)
            .attr("y", this.height + this.margin.bottom)
            .text(xLabelText);

        this.yAxisLabel = this.svg.append("text")
            .attr("class", "ylabel")
            .attr("text-anchor", "middle")
            .attr("y", this.margin.top + this.height / 2)
            .attr("x", this.margin.left / 2)
            .attr("transform", `rotate(${-90} ${this.margin.left / 3} ${this.margin.top + this.height / 2})`)
            .text(yLabelText);
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
                // resetting everything to first view
                this.zoomOut();
            }

        } else {
            this.xScale.domain([s[0] - this.margin.left, s[1] - this.margin.left].map(this.xScale.invert, this.xScale));
            this.svg.select(".brush").call(this.brush.move, null);
            this.zoomIn();
        }
    }

    idled() {
        this.idleTimeout = null;
    }

    // implemented on child components
    protected zoomIn() {};
    protected zoomOut() {};
}