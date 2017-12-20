import { Input, Component, OnInit, OnChanges, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";


@Component({
  selector: 'barchart',
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class BarChartComponent {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input('searchData') set searchData(value: { 
      key: any, 
      doc_count: number
    }[]) {
    if (value && value!=this.barChartData) {
      this.barChartData = value;
      this.calculateDomains();
      this.createChart();
      this.updateChart();
    }
  };
  @Input() public visualizedField;

  private yAsPercent: boolean = false;
  private yTicks: number = 10;
  private margin = { top: 10, bottom: 100, left: 70, right: 10 };
  private chart: any;
  private width: number;
  private height: number;
  private xScale: d3.ScaleBand<string>;
  private yScale: d3.ScaleLinear<number, number>;
  private xAxis: d3.Selection<any, any, any, any>;
  private yAxis: d3.Selection<any, any, any, any>;
  private yMax: number;
  private barChartData: Array<KeyFrequencyPair>;
  private xDomain: Array<string>;
  private yDomain: Array<number>;
  private yAxisLabel: any;
  private update: any;

  calculateDomains() {
    // adjust the x and y ranges
    this.xDomain = this.barChartData.map(d => d.key);
    this.yMax = d3.max(this.barChartData.map(d => d.doc_count));
    this.yDomain = this.yAsPercent? [0, 1] : [0, this.yMax];
    this.yTicks = (this.yDomain[1] > 1 && this.yDomain[1] < 20) ? this.yMax : 10;
  }

  rescaleY() {
    /**
    * if the user selects percentage / count display, 
    * - rescale y values & axis
    * - change axis label and ticks
    */
    this.calculateDomains();
    this.yScale.domain(this.yDomain);

    let totalCount = _.sumBy(this.barChartData, d => d.doc_count);
    let preScale = this.yAsPercent? d3.scaleLinear().domain([0,totalCount]).range([0,1]) : d3.scaleLinear();

    this.chart.selectAll('.bar')
      .transition()
      .attr('y', d => this.yScale(preScale(d.doc_count)))
      .attr('height', d => this.height - this.yScale(preScale(d.doc_count))); 
    
    let tickFormat = this.yAsPercent? d3.format(".0%") : d3.format("d");
    let yAxis = d3.axisLeft(this.yScale).ticks(this.yTicks).tickFormat(tickFormat)
    this.yAxis.call(yAxis);
    let yLabelText = this.yAsPercent? "Percent" : "Frequency";
    this.yAxisLabel.text(yLabelText);
  }


  createChart() {
  /**
  * select DOM elements, set up scales and axes
  */
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.xScale = d3.scaleBand().domain(this.xDomain).rangeRound([0, this.width]).padding(.1);
    this.yScale = d3.scaleLinear().domain(this.yDomain).range([this.height, 0]);

    this.xAxis = svg.append('g')
      .attr('class', 'axis x')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .call(d3.axisBottom(this.xScale));

    // set style of x tick marks
    this.xAxis.selectAll('text')
      .style("text-anchor", "end")
       .attr("dx", "-.8em")
       .attr("dy", ".15em")
       .attr("transform", "rotate(-35)" ); 

    this.yAxis = svg.append('g')
      .attr('class', 'axis y')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .call(d3.axisLeft(this.yScale).ticks(this.yTicks).tickFormat(d3.format("d")));

    // adding axis labels
    let xLabelText = this.visualizedField.replace(/\b\w/g, l => l.toUpperCase());
    // capitalize name of variable
    let yLabelText = "Frequency";

    svg.append("text")
      .attr("class", "xlabel")
      .attr("text-anchor", "middle")
      .attr("x", this.width/2)   
      .attr("y", this.height + this.margin.bottom)
      .text(xLabelText);

    this.yAxisLabel = svg.append("text")
      .attr("class", "ylabel")
      .attr("text-anchor", "middle")
      .attr("y", this.margin.top+this.height/2)
      .attr("x", this.margin.left/2)
      .attr("transform", `rotate(${-90} ${this.margin.left/3} ${this.margin.top+this.height/2})`)
      .text(yLabelText);

    }

  updateChart() {
  /**
  * bind data to chart, remove or update existing bars, add new bars
  */

    const update = this.chart.selectAll('.bar')
      .data(this.barChartData);

    // remove exiting bars
    update.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
      .attr('x', d => this.xScale(d.key))
      .attr('y', d => this.yScale(d.doc_count))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(d.doc_count));

    // add new bars
    update
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(d.key))
      .attr('width', this.xScale.bandwidth())
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
}
