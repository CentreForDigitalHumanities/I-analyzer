import { Input, Component, OnChanges, ElementRef, ViewEncapsulation, SimpleChanges } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";


@Component({
    selector: 'barchart',
    templateUrl: './barchart.component.html',
    styleUrls: ['./barchart.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class BarChartComponent implements OnChanges {
    @Input('searchData')
    public searchData: {
        key: any,
        doc_count: number,
        key_as_string?: string
    }[];
    @Input() public visualizedField;
    @Input() public chartElement;

    private yAsPercent: boolean = false;
    private visualizingDate: boolean = false;
    private yTicks: number = 10;
    private xTickValues: string[];
    private margin = { top: 10, bottom: 120, left: 70, right: 10 };
    private svg: any;
    private chart: any;
    private width: number;
    private height: number;
    private xScale: any; // can be either categorical or continuous
    private yScale: d3.ScaleLinear<number, number>;
    private xAxis: d3.Selection<any, any, any, any>;
    private yAxis: d3.Selection<any, any, any, any>;
    private xAxisClass: any;
    private yMax: number;
    private xDomain: Array<string>;
    private yDomain: Array<number>;
    private yAxisLabel: any;
    private update: any;
    private zoom: any;
    private view: any;
    private selectedData: Array<KeyFrequencyPair>;
    private years: Array<KeyFrequencyPair>;
    private months: Array<KeyFrequencyPair>;
    private weeks: Array<KeyFrequencyPair>;
    private currentTimeCategory: string;

    ngOnChanges(changes: SimpleChanges) {
        if (this.searchData && this.visualizedField) {
            // date fields are returned with keys containing identifiers by elasticsearch
            // replace with string representation, contained in 'key_as_string' field
            this.calculateDomains();
            
            if (changes['visualizedField'] != undefined) {
                this.createChart(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
                this.drawChartData();
                this.setScaleY();
            }
        }
    }

    calculateDomains() {
        /**
         adjust the x and y ranges
         */
        this.visualizingDate = false;

        if ('key_as_string' in this.searchData[0]) {
                this.searchData.forEach(cat => cat.key = new Date(cat.key_as_string));
                this.years = this.rearrangeDates(_.groupBy(this.searchData, item => d3.timeYear(item.key)));
                this.months = this.rearrangeDates(_.groupBy(this.searchData, item => d3.timeMonth(item.key)));
                this.weeks = this.rearrangeDates(_.groupBy(this.searchData, item => d3.timeWeek(item.key)));
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
                    this.currentTimeCategory = 'weeks'
                }
                else {
                    this.selectedData = this.searchData;
                }

                this.visualizingDate = true;
        }
        else {
            this.selectedData = this.searchData;
        }

        this.xDomain = this.searchData.map(d => d.key);
        this.yMax = d3.max(this.selectedData.map(d => d.doc_count));
        this.yDomain = this.yAsPercent ? [0, 1] : [0, this.yMax];
        this.yTicks = (this.yDomain[1] > 1 && this.yDomain[1] < 20) ? this.yMax : 10;
        this.xTickValues = this.xDomain.length > 30 ? this.xDomain.filter((d, i) => i % 10 == 0) : this.xDomain;
    }

    setScaleY() {
        /**
        * if the user selects percentage / count display,
        * - rescale y values & axis
        * - change axis label and ticks
        */
        this.calculateDomains();
        this.yScale.domain(this.yDomain);

        let totalCount = _.sumBy(this.selectedData, d => d.doc_count);
        let preScale = this.yAsPercent ? d3.scaleLinear().domain([0, totalCount]).range([0, 1]) : d3.scaleLinear();

        this.chart.selectAll('.bar')
            .transition()
            .attr('y', d => this.yScale(preScale(d.doc_count)))
            .attr('height', d => this.height - this.yScale(preScale(d.doc_count)));

        let tickFormat = this.yAsPercent ? d3.format(".0%") : d3.format("d");
        let yAxis = d3.axisLeft(this.yScale).ticks(this.yTicks).tickFormat(tickFormat)
        this.yAxis.call(yAxis);

        let yLabelText = this.yAsPercent ? "Percent" : "Frequency";
        this.yAxisLabel.text(yLabelText);
    }

    setScaleX() {

    }

    /**
     * Creates the chart to draw the data on (including axes and labels).
     * @param forceRedraw Erases the current chart and create a new one.
     */
    createChart(forceRedraw: boolean) {
        /**
        * select DOM elements, set up scales and axes
        */
        if (this.svg) {
            this.svg.remove();
        }

        this.svg = d3.select(this.chartElement).append('svg')
            .attr('width', this.chartElement.offsetWidth)
            .attr('height', this.chartElement.offsetHeight);

        this.width = this.chartElement.offsetWidth - this.margin.left - this.margin.right;
        this.height = this.chartElement.offsetHeight - this.margin.top - this.margin.bottom;

        this.svg.selectAll('g').remove();
        this.svg.selectAll('text').remove();
        // chart plot area
        this.chart = this.svg.append('g')
            .attr('class', 'bars')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        if (this.visualizingDate==true) {
            // dealing with date data, use scaleTime for x axis instead
            this.xScale = d3.scaleTime()
                .domain(d3.extent(this.xDomain, d => new Date(d)))
                .range([0, this.width]);
        }
        else {
            this.xScale = d3.scaleBand().domain(this.xDomain).rangeRound([0, this.width]).padding(.1);
        }

        this.yScale = d3.scaleLinear().domain(this.yDomain).range([this.height, 0]);

        //this.xAxisClass = d3.axisBottom(this.xScale).tickValues(this.xTickValues);
        this.xAxisClass = d3.axisBottom(this.xScale);

        this.xAxis = this.svg.append('g')
            .attr('class', 'axis x')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .call(this.xAxisClass);

        // set style of x tick marks
        this.xAxis.selectAll('text')
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)");

        this.yAxis = this.svg.append('g')
            .attr('class', 'axis y')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale).ticks(this.yTicks).tickFormat(d3.format("d")));

        // adding axis labels
        let xLabelText = this.visualizedField.replace(/\b\w/g, l => l.toUpperCase());
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
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        
        this.svg.call(this.zoom);
    }

    zoomed() {
            let t = d3.event.transform;
            let xExtent = t.rescaleX(this.xScale).domain();
            // if there are more than 10 categories within the current x extent,
            // group into next highest time level
            let selection = this.selectedData.filter( d => d.key >= xExtent[0] && d.key <= xExtent[1] );
            if (selection.length > 30) {
                this.biggerTimeCategory(xExtent[0], xExtent[1]);
                this.drawChartData();
            }
            else if (selection.length < 10) {
                this.smallerTimeCategory(xExtent[0], xExtent[1]);
                this.drawChartData();
            }            
            this.xAxis.call(this.xAxisClass.scale(t.rescaleX(this.xScale)));
            this.chart.selectAll('.bar').attr("transform", t);
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
                break;
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

        let xBarWidth = this.visualizingDate? this.width/this.selectedData.length : this.xScale.bandwidth();

        // update existing bars
        this.chart.selectAll('.bar').transition()
            .attr('x', d => this.xScale(d.key))
            .attr('y', d => this.yScale(d.doc_count))
            .attr('width', xBarWidth)
            .attr('height', d => this.height - this.yScale(d.doc_count));

        // add new bars
        update
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.key))
            .attr('width', xBarWidth)
            .attr('y', d => this.yScale(0)) //set to zero first for smooth transition
            .attr('height', 0)
            .transition()
            .delay((d, i) => i * 10)
            .attr('y', d => this.yScale(d.doc_count))
            .attr('height', d => this.height - this.yScale(d.doc_count));

    }

}


type KeyFrequencyPair = {
    key: string;
    doc_count: number;
    key_as_string?: string;
}
