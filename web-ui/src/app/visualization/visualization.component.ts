import { Input, Component, OnInit, OnChanges, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";

import { Subscription }   from 'rxjs/Subscription';


import { SearchService } from '../services/index';

@Component({
  selector: 'visualization',
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.scss'],
  providers: [SearchService],
  encapsulation: ViewEncapsulation.None
})
export class VisualizationComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private searchData: Array<any>;

  private margin: any = { top: 20, bottom: 20, left: 20, right: 20};		    
  private chart: any; 
  private width: number;	  
  private height: number;	  
  private xScale: d3.ScaleLinear<number, number>;		  
  private yScale: d3.ScaleLinear<number, number>;		  	  
  private xAxis: d3.Selection<any, any, any, any>;	  
  private yAxis: d3.Selection<any, any, any, any>;
  private yMax: number;
  private timeLineData: Array<YearFrequencyPair>;
  private xDomain: Array<number>;
  private yDomain: Array<number>;
 
  ngOnInit() {	    
  	if (this.searchData) {
  		this.createTimelineData(this.searchData);
  		this.calculateDomains();
  		this.createChart();	      
  	   	this.updateChart();		    
  	}		
  }

  ngOnChanges() {		    
  	if (this.chart) {
  		this.createTimelineData(this.searchData);
  		this.calculateDomains();	      
  		this.updateChart();		    
  	}		  
  }	

  createTimelineData(results: Array<any>) {
  	// transform the results exposed from search.service.ts to suitable timeline data
    let yearCounts = _.countBy(results.map(d => d['year']));
    this.timeLineData = [];
    for (let key in yearCounts) {
    	let yearFreqPair = {year: Number(key), frequency: yearCounts[key]};
    	this.timeLineData.push(yearFreqPair);
    }
    console.log(this.timeLineData);
  }

  calculateDomains() {
  	// adjust the x and y ranges
  	let years = this.timeLineData.map(d => d.year);
  	this.xDomain = [d3.min(years),d3.max(years)];
  	this.yMax = d3.max(this.timeLineData.map(d => d.frequency));
   	this.yDomain = [0, this.yMax];
  }

  createChart() {		    
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
   	 // define X & Y domains	    
   		    
    this.xScale = d3.scaleLinear().domain(this.xDomain).range([0, this.width]);
    this.yScale = d3.scaleLinear().domain(this.yDomain).range([this.height, 0]);  
    
    this.xAxis = svg.append('g')		      
    	.attr('class', 'axis axis-x')		      
    	.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)		      
    	.call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")));

    this.yAxis = svg.append('g')		      
    	.attr('class', 'axis axis-y')		      
    	.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)		      
    	.call(d3.axisLeft(this.yScale).ticks(this.yMax).tickFormat(d3.format("d")));		  
    }

  updateChart() {	    
  	// update scales & axis		    
  	this.xScale.domain(this.xDomain);	    
  	this.yScale.domain(this.yDomain);		    
  	this.xAxis.transition().call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")));		    
  	this.yAxis.transition().call(d3.axisLeft(this.yScale).ticks(this.yMax).tickFormat(d3.format("d")));		
    const update = this.chart.selectAll('.bar')		      
    	.data(this.timeLineData);		
    
    // remove exiting bars		    
    update.exit().remove();

    // calculate optimal width of bars
    let barWidth = Math.floor(this.width/(this.xDomain[1]-this.xDomain[0]))-1;	
    
    // update existing bars		    
    this.chart.selectAll('.bar').transition()		      
    	.attr('x', d => this.xScale(d.year))		      
    	.attr('y', d => this.yScale(d.frequency))
    	.attr('width', barWidth)		      
    	.attr('height', d => this.height - this.yScale(d.frequency))
    	.style('fill', 'blue');	
    
    // add new bars		    
    update		      
    	.enter()		      
    	.append('rect')		      
    	.attr('class', 'bar')		      
    	.attr('x', d => this.xScale(d.year))
    	.attr('width', barWidth)		      
    	.attr('y', d => this.yScale(0)) /*set to zero first for smooth transision*/
    	.attr('height', 0)	      
    	.style('fill', 'blue')		      
    	.transition()		      
    	.delay((d, i) => i * 10)		      
    	.attr('y', d => this.yScale(d.frequency))
    	.attr('height', d => this.height - this.yScale(d.frequency));	
    }


}

type YearFrequencyPair = {
	year: number;
	frequency: number;
}
