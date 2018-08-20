import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";
import * as moment from 'moment';

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
    idleTimeout: any;
    idleDelay: number;

    private currentTimeCategory: string;
    private selectedData: Array<DateFrequencyPair>;
    private histogram: any;
    private bins: any;


    ngOnChanges(changes: SimpleChanges) {
        if (this.searchData && this.visualizedField) {
            this.calculateCanvas();
            this.prepareTimeline();
            this.calculateDomains();


            if (changes['visualizedField'] != undefined) {
                this.createChart(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
                this.setScaleY();
<<<<<<< HEAD
                //this.xAxis.selectAll('text').each(this.parseXaxis);
=======
>>>>>>> b0f06d7a989ce5abdf89c48da436446d538abf91
                this.drawChartData(this.selectedData);
                this.setupBrushBehaviour();
            }
        }
    }

    prepareTimeline() {
        this.selectedData = this.formatTimeData();

        this.xDomain = d3.extent(this.selectedData, d => d.date);
        this.xScale = d3.scaleTime()
            .domain(this.xDomain)
            .range([0, this.width])
            .clamp(true);

        let ticks = this.xScale.ticks(10);
        let date = ticks[0];

        console.log(d3.timeYear.offset(date,0), date, d3.timeMinute(date) < date);

        let [min, max] = this.xScale.domain();

        this.histogram = d3.histogram<DateFrequencyPair, Date>()
            .value(d => d.date)
            .domain([min, max])
            .thresholds(this.xScale.ticks(d3.timeYear));

        this.currentTimeCategory = 'years';

    }

    rescaleX() {
        let t = this.svg.transition().duration(750);
        //this.xAxis.selectAll('text').each(this.parseXaxis);
        this.xAxis.transition(t).call(this.xAxisClass);
    }

    formatTimeData() {
        /* date fields are returned with keys containing identifiers by elasticsearch
         replace with string representation, contained in 'key_as_string' field
        */
        //console.log(moment("1660-01-01").utcOffset(0).toDate());
        let outData = this.searchData.map(cat => {
            let event = new Date(cat.key_as_string).setHours(0,0,0);
            console.log(event);
            return {
<<<<<<< HEAD
                //date: moment(cat.key_as_string).utcOffset(0).toDate(),
                date: new Date(cat.key_as_string),
                //date: moment(cat.key_as_string).startOf('day').toDate(),
=======
                date: new Date(cat.key_as_string),
>>>>>>> b0f06d7a989ce5abdf89c48da436446d538abf91
                doc_count: cat.doc_count
            };
        });
        return outData;
    }

    formatDate(date_string) {
        let d = new Date(date_string);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
    }

    parseXaxis(d) {
    var el = d3.select(this);
    var dtFormat = d3.timeFormat('%Y %m %d');
    console.log(dtFormat(d))
    var words = dtFormat(d).split(' ');
    console.log(words);
    el.text('');

    if (words[1] == "00:00") {
        el.append('tspan').text(words[0]);        
    }
    else {
        el.append('tspan').text(words[1]);        
    }    
    };           

    drawChartData(inputData) {
        /**
        * bind data to chart, remove or update existing bars, add new bars
        */
        this.bins = this.histogram(inputData);
        this.bins.forEach(d => {
            if (d.length != 0) {
                d.doc_count = _.sumBy(d, item => item.doc_count);
            }
            else {
                d.doc_count = 0;
            }
        });

        const update = this.chart.selectAll('.bar')
            .data(this.bins);

        // remove exiting bars
        update.exit().remove();

        this.yDomain = [0, Number(d3.max(this.bins.map(d => d.doc_count)))];
        this.yScale.domain(this.yDomain);
        this.yAxis.call(this.yAxisClass);

        this.chart.selectAll('.bar').transition()
            .attr('x', d => this.xScale(d.x0))
            .attr('y', d => this.yScale(d.doc_count))
            .attr('width', d => this.calculateWidth(d))
            .attr('height', d => this.height - this.yScale(d.doc_count));

        // add new bars
        update
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.x0))
            .attr('width', d => this.calculateWidth(d))
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
                // resetting everything to first view
                this.xScale.domain(this.xDomain);
                this.rescaleX();
                this.histogram.thresholds(this.xScale.ticks(d3.timeYear));
                this.currentTimeCategory = 'years';
                this.drawChartData(this.selectedData);
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

    zoomIn() {
        this.rescaleX();
        let xExtent = this.xScale.domain();
        let selection = this.bins.filter(d => d.x1 >= xExtent[0] && d.x0 <= xExtent[1]);
        if (selection.length < 10 && this.currentTimeCategory != 'days') {
            // rearrange data to look at a smaller time category
            this.adjustTimeCategory();
            this.drawChartData(this.selectedData.filter(
                d => d.date >= xExtent[0] && d.date <= xExtent[1]));
        }
        else {
            // zoom in without rearranging underlying data
            this.chart.selectAll('.bar')
                .transition().duration(750)
                .attr('x', d => this.xScale(d.x0))
                .attr('y', d => this.yScale(d.doc_count))
                .attr('width', d => this.calculateWidth(d));
        }
    }

    calculateWidth(bin) {
        let width = this.xScale(bin.x1) - this.xScale(bin.x0) - 1;
        if (width > 0) {
            return width
        }
        else return 0;
    }

    adjustTimeCategory() {
        switch (this.currentTimeCategory) {
            case 'years':
                this.histogram.thresholds(this.xScale.ticks(d3.timeMonth));
                this.currentTimeCategory = 'months';
                break;
            case 'months':
                this.histogram.thresholds(this.xScale.ticks(d3.timeWeek));
                this.currentTimeCategory = 'weeks';
                break;
            case 'weeks':
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
