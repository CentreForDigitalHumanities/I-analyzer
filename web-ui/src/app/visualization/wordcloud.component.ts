import { Component, ElementRef, Input, OnInit, OnChanges, ViewEncapsulation } from '@angular/core';

import * as cloud from 'd3-cloud';
import * as d3 from 'd3';

@Component({
  selector: 'wordcloud',
  templateUrl: './wordcloud.component.html',
  styleUrls: ['./wordcloud.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class WordcloudComponent implements OnInit {
	@Input() public chartElement;

  	public width: number = 500;
  	public height: number = 500;

  constructor() { }

  ngOnInit() {
  	d3.selectAll('svg').remove();
  	d3.selectAll('form').remove();
  	
  	let layout = cloud()
  		.size([this.width, this.height])
	    .words([
	      "Hello", "world", "normally", "you", "want", "more", "words",
	      "than", "this"].map(function(d) {
	      return {text: d, size: 10 + Math.random() * 90, test: "haha"};
	    }))
	    .padding(5)
	    .rotate(function() { return ~~(Math.random() * 2) * 90; })
	    .font("Impact")
	    .fontSize(function(d) { return d.size; })
	    .on("end", draw);
	
	layout.start();
  
	function draw(words) {
  		let fill = d3.scaleOrdinal(d3.schemeCategory20);
 		let wordcloud = d3.select(this.chartElement).append("svg")
	      .attr("width", this.width)
	      .attr("height", this.height)
	    .append("g")
	      .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")")
	    .selectAll("text")
	      .data(words)
	    .enter().append("text");
	    console.log(wordcloud);
	   	/*
	      .style("font-size", function(d) { console.log(d.size); return 1; })//return d.size + "px"; })
	      .style("font-family", "Impact")
	      //.style("fill", function(d, i) { return fill(i); })
	      .attr("text-anchor", "middle");
	      //.attr("transform", function(d) {
	      //  return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
	      //})
	      //.text(function(d) { return d.text; });*/
	}
  }

}
