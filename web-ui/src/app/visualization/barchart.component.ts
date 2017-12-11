import { Input, Component, OnInit, OnChanges, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";

import { Subscription }   from 'rxjs/Subscription';


import { SearchService } from '../services/index';

@Component({
  selector: 'barchart',
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BarChartComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() public searchData: Array<any>;
  @Input() public countKey: string;
  yAsPercent: boolean = false;
  private margin = { top: 20, bottom: 60, left: 60, right: 20};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: d3.ScaleBand<string>;
  private yScale: d3.ScaleLinear<number, number>;
  private xAxis: d3.Selection<any, any, any, any>;
  private yAxis: d3.Selection<any, any, any, any>;
  private yMax: number;
  private barChartData: Array<CategoryFrequencyPair>;
  private xDomain: Array<string>;
  private yDomain: Array<number>;
  private yAxisLabel: any;
  private update: any;

  ngOnInit() {
    setTimeout(500);
    this.createBarChartData(this.searchData);
    this.calculateDomains();  
    this.createChart();
    this.updateChart();
  }

  ngOnChanges() {
    if (this.chart) {
      this.createBarChartData(this.searchData);
      this.calculateDomains();
      this.updateChart();
    }
  }


  createBarChartData(results: Array<any>) {
    /** 
    * transform the results exposed from search.service.ts to suitable term frequency data
    * d3 needs an array of dictionaries
    * the countkey defines which aspect of the data appears in the bar chart
    */
    console.log(results, this.countKey);
    let counts = _.countBy(results.map(d => d[this.countKey]));
    this.yMax = d3.max(Object.values(counts));
    let yMax = this.yMax;
    let categories = Object.keys(counts).sort();
    this.barChartData = categories.map(function(cat) {
      let catFreqPair = {category: cat, frequency: counts[cat]};
      return catFreqPair;
    });
    console.log(this.barChartData);
  }

  calculateDomains() {
    // adjust the x and y ranges
    this.xDomain = this.barChartData.map(d => d.category);
    this.yDomain = this.yAsPercent? [0, 1] : [0, this.yMax];
  }

  rescaleY() {
    /**
    * if the user selects percentage / count display, 
    * - rescale y values & axis
    * - change axis label and ticks
    */
    this.calculateDomains();
    this.yScale.domain(this.yDomain);

    let totalCount = _.sumBy(this.barChartData, d => d.frequency);
    let preScale = this.yAsPercent? d3.scaleLinear().domain([0,totalCount]).range([0,1]) : d3.scaleLinear();

    this.chart.selectAll('.bar')
      .attr('y', d => this.yScale(preScale(d.frequency)))
      .attr('height', d => this.height - this.yScale(preScale(d.frequency))); 
    
    let theFormat = this.yAsPercent? d3.format(".0%") : d3.format("d");
    let theMax = this.yAsPercent ? 10 : this.yMax;
    let theAxis = d3.axisLeft(this.yScale).ticks(theMax).tickFormat(theFormat)
    this.yAxis.call(theAxis);
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

    this.yAxis = svg.append('g')
      .attr('class', 'axis y')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .call(d3.axisLeft(this.yScale).ticks(this.yMax).tickFormat(d3.format("d")));

    // adding axis labels
    let xLabelText = this.countKey.replace(/\b\w/g, l => l.toUpperCase());
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
    // update scales & axis
    this.xScale.domain(this.xDomain);
    this.yScale.domain(this.yDomain);
    this.xAxis.transition().call(d3.axisBottom(this.xScale));

    const update = this.chart.selectAll('.bar')
      .data(this.barChartData);

    // remove exiting bars
    update.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
      .attr('x', d => this.xScale(d.category))
      .attr('y', d => this.yScale(d.frequency))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(d.frequency));

    // add new bars
    update
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(d.category))
      .attr('width', this.xScale.bandwidth())
      .attr('y', d => this.yScale(0)) //set to zero first for smooth transition
      .attr('height', 0)
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => this.yScale(d.frequency))
      .attr('height', d => this.height - this.yScale(d.frequency));
    }

}


type CategoryFrequencyPair = {
  category: string;
  frequency: number;
}
