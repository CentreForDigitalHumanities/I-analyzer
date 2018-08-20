import { Input, Component, OnChanges, ElementRef, ViewEncapsulation, SimpleChanges } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";


@Component({
        selector: 'ia-barchart',
        templateUrl: './barchart.component.html',
        styleUrls: ['./barchart.component.scss'],
        encapsulation: ViewEncapsulation.None
})

export class BarChartComponent implements OnChanges {
    @Input('searchData') searchData: {
        key: any,
        doc_count: number,
        key_as_string?: string
    }[];
    @Input() visualizedField;
    @Input() chartElement;

    public yAsPercent: boolean = false;
    //public visualizingDate: boolean = false;
    public yTicks: number = 10;
    public margin = { top: 10, bottom: 120, left: 70, right: 10 };
    public svg: any;
    public chart: any;
    public width: number;
    public height: number;
    public xScale: any; // can be either ordinal or time scale
    public yScale: d3.ScaleLinear<number, number>;
    public xAxis: d3.Selection<any, any, any, any>;
    public yAxis: d3.Selection<any, any, any, any>;
    public xAxisClass: any;
    public yAxisClass: any;
    private yMax: number;
    private totalCount: number;
    public xDomain: Array<any>;
    public yDomain: Array<number>;
    public yAxisLabel: any;

    private xBarWidth: number;

    ngOnChanges(changes: SimpleChanges) {
        if (this.searchData && this.visualizedField) {
            this.calculateCanvas();
            this.prepareTermFrequency();
            this.calculateDomains();
            
            if (changes['visualizedField'] != undefined) {
                this.createChart(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
                this.drawChartData(this.searchData);
                this.setScaleY();
            }
        }
    }

    calculateCanvas() {
        this.height = this.chartElement.offsetHeight - this.margin.top - this.margin.bottom;
        this.width = this.chartElement.offsetWidth - this.margin.left - this.margin.right;
    }

    calculateDomains() {
        /**
         adjust the x and y ranges
         */
        this.yDomain = [0, this.yMax];
        this.totalCount = _.sumBy(this.searchData, d => d.doc_count);
        this.yTicks = (this.yDomain[1] > 1 && this.yDomain[1] < 20) ? this.yMax : 10;
        this.yScale = d3.scaleLinear().domain(this.yDomain).range([this.height, 0]);
    }

    prepareTermFrequency() {
        this.xDomain = this.searchData.map(d => d.key);
        this.xScale = d3.scaleBand().domain(this.xDomain).rangeRound([0, this.width]).padding(.1);
        this.xBarWidth = this.xScale.bandwidth();
        this.yMax = d3.max(this.searchData.map(d => d.doc_count));
    }

    setScaleY() {
        /**
        * if the user selects percentage / count display,
        * - rescale y values & axis
        * - change axis label and ticks
        */
        this.yDomain = this.yAsPercent ? [0, 1] : [0, this.yMax];
        this.yScale.domain(this.yDomain);

        let preScale = this.yAsPercent ? d3.scaleLinear().domain([0, this.totalCount]).range([0, 1]) : d3.scaleLinear();

        this.chart.selectAll('.bar')
                .transition()
                .attr('y', d => this.yScale(preScale(d.doc_count)))
                .attr('height', d => this.height - this.yScale(preScale(d.doc_count)));

        let tickFormat = this.yAsPercent ? d3.format(".0%") : d3.format("d");
        this.yAxisClass = d3.axisLeft(this.yScale).ticks(this.yTicks).tickFormat(tickFormat)
        this.yAxis.call(this.yAxisClass);

        let yLabelText = this.yAsPercent ? "Percent" : "Frequency";
        this.yAxisLabel.text(yLabelText);
    }

    /**
     * Creates the chart to draw the data on (including axes and labels).
     * @param forceRedraw: erase the current chart and create a new one.
     */
    createChart(forceRedraw: boolean) {
        /**
        * select DOM elements, set up scales and axes
        */
        d3.select('svg').remove();

        this.svg = d3.select(this.chartElement).append('svg')
          .attr('width', this.chartElement.offsetWidth)
          .attr('height', this.chartElement.offsetHeight);

        this.svg.selectAll('g').remove();
        this.svg.selectAll('text').remove();
        // chart plot area
        this.chart = this.svg.append('g')
          .attr('class', 'bars')
          .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this.xAxisClass = d3.axisBottom(this.xScale);
        this.xAxis = this.svg.append('g')
          .attr('class', 'axis-x')
          .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
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
          .attr('y', d => this.yScale(0)) //set to zero first for smooth transition
          .attr('height', 0)
          .transition().duration(750)
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
