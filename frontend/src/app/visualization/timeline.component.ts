import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";

// custom definition of scaleTime to avoid Chrome issue with displaying historical dates
import { Corpus, DateFrequencyPair, QueryModel } from '../models/index';
import { default as scaleTimeCustom }from './timescale.js';
import { BarChartComponent } from './barchart.component';

const hintSeenSessionStorageKey = 'hasSeenTimelineZoomingHint';
const hintHidingMinDelay = 500;       // milliseconds
const hintHidingDebounceTime = 1000;  // milliseconds

@Component({
    selector: 'ia-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent extends BarChartComponent implements OnChanges, OnInit {
    @ViewChild('timeline') private timelineContainer: ElementRef;
    @Input() corpus: Corpus;
    @Input() queryModel: QueryModel;
    @Input() visualizedField;
    @Input() asPercent;

    public xScale: d3.ScaleTime<any, any>;

    private brush: any;
    idleTimeout: any;
    idleDelay: number;
    showHint: boolean;

    private currentTimeCategory: string;
    private selectedData: Array<DateFrequencyPair>;
    private zoomedOutData: Array<DateFrequencyPair>;
    private scaleDownThreshold: number = 10;
    private timeFormat: any = d3.timeFormat("%Y-%m-%d");

    ngOnInit() {
        this.setupZoomHint();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.chartElement == undefined) {
            this.chartElement = this.timelineContainer.nativeElement;
        }
        let min = new Date(this.visualizedField.searchFilter.currentData.min);
        let max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.calculateTimeCategory(min, max);    
        this.calculateCanvas();
        this.xScale = scaleTimeCustom()
            .range([0, this.width])
            .clamp(true);
        this.prepareTimeline().then( () => {
            this.zoomedOutData = _.cloneDeep(this.selectedData);
            this.calculateDomains();
            this.createChart();
            this.rescaleY();
            this.calculateY();
            this.drawChartData();
            this.setupBrushBehaviour();
        });

        //listen for changes in 'asPercent'
        if (changes['asPercent'] != undefined) {
            if (changes['asPercent'].previousValue != changes['asPercent'].currentValue) {
                this.rescaleY();
            }
        }
    }

    async prepareTimeline() {
        await this.requestTimeData();
        this.dataService.pushCurrentTimelineData({ data: this.selectedData, timeInterval: this.currentTimeCategory });
        this.setDomains();
    }

    setDomains() {   
        let min = new Date(this.visualizedField.searchFilter.currentData.min);
        let max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.xScale.domain(this.xDomain);
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

    async requestTimeData() {
        /* date fields are returned with keys containing identifiers by elasticsearch
         replace with string representation, contained in 'key_as_string' field
        */
        let dataPromise = this.searchService.dateHistogramSearch(this.corpus, this.queryModel, this.visualizedField.name, this.currentTimeCategory).then( result => {
            return result.aggregations[this.visualizedField.name].filter( cat => cat.doc_count > 0).map( cat => {
                return {
                    date: new Date(cat.key_as_string),
                    doc_count: cat.doc_count
                }
            });
        });
        this.selectedData = await dataPromise;
    }

    calculateY() {
        /**
        * calculate y dimensions
        */
        this.yMax = d3.max(this.selectedData.map(d => d.doc_count));
        this.yDomain = [0, this.yMax];
        this.yScale.domain(this.yDomain);
        this.yAxis.call(this.yAxisClass);
    }

    drawChartData() {
        /**
        * bind data to chart, remove or update existing bars, add new bars
        */
        const update = this.chart.selectAll('.bar')
            .data(this.selectedData);

        // remove exiting bars
        update.exit().remove();

        this.chart.selectAll('.bar').transition()
            .attr('x', d => this.xScale(d.date))
            .attr('y', d => this.yScale(d.doc_count))
            .attr('width', d => this.calculateBarWidth(d.date))
            .attr('height', d => this.height - this.yScale(d.doc_count));

        // add new bars
        update
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.date))
            .attr('width',  d => this.calculateBarWidth(d.date))
            .attr('y', this.yScale(0)) //set to zero first for smooth transition
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
                this.selectedData = _.cloneDeep(this.zoomedOutData);
                this.currentTimeCategory = 'year';
                this.dataService.pushCurrentTimelineData({data: this.selectedData, timeInterval: this.currentTimeCategory});
                this.visualizedField.searchFilter.currentData = this.visualizedField.searchFilter.defaultData;
                this.setDomains();
                this.calculateDomains();
                this.rescaleX();
                this.calculateY();
                this.rescaleY();
                this.drawChartData();
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
        let previousTimeCategory = this.currentTimeCategory;
        this.calculateTimeCategory(xExtent[0], xExtent[1]);
        // check if xExtent, counted in current time category, is smaller than scaleDownThreshold
        if (this.currentTimeCategory == 'day' || previousTimeCategory == this.currentTimeCategory) {
            // zoom in without rearranging underlying data
            this.chart.selectAll('.bar')
                .transition().duration(750)
                .attr('x', d => this.xScale(d.date))
                .attr('y', d => this.yScale(d.doc_count))
                .attr('width', d => this.calculateBarWidth(d.date));
        }
        else {
            let filter = this.visualizedField.searchFilter;
            filter.currentData = { filterType: "DateFilter", min: this.timeFormat(xExtent[0]), max: this.timeFormat(xExtent[1]) };
            this.queryModel.filters.push(filter);
            this.prepareTimeline().then( () => {
                this.calculateDomains();
                this.calculateY();
                this.rescaleY();
                this.drawChartData();
            });
        }
    }

    calculateTimeCategory(min: Date, max: Date) {
        if (d3.timeYear.count(min, max) >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'year';
            // this.timeFormat = d3.timeFormat("%Y");
        }
        else if (d3.timeMonth.count(min, max) >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'month';
            // this.timeFormat = d3.timeFormat("%B");
        }
        else if (d3.timeWeek.count(min, max) >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'week';
            // this.timeFormat = d3.timeFormat("%b %d");
        }
        else {
            this.currentTimeCategory = 'day';
            // this.timeFormat = d3.timeFormat("%a %d");
        }
    }

    calculateBarWidth(startDate: Date) {
        let endDate: Date;
        switch(this.currentTimeCategory) {
            case 'year':
                endDate = d3.timeYear.ceil(startDate);
                break;
            case 'month':
                endDate = d3.timeMonth.ceil(startDate);
                break;
            case 'week':
                endDate = d3.timeWeek.ceil(startDate);
                break;
            case 'day':
                endDate = d3.timeDay.ceil(startDate);
                break;
        }
        return this.xScale(endDate)-this.xScale(startDate);
    }

    /**
     * Show the zooming hint once per session, hide automatically with a delay
     * when the user moves the mouse.
     */
    setupZoomHint() {
        if (!sessionStorage.getItem(hintSeenSessionStorageKey)) {
            sessionStorage.setItem(hintSeenSessionStorageKey, 'true');
            this.showHint = true;
            const hider = _.debounce(() => {
                this.showHint = false;
                document.body.removeEventListener('mousemove', hider);
            }, hintHidingDebounceTime);
            _.delay(() => {
                document.body.addEventListener('mousemove', hider);
            }, hintHidingMinDelay);
        }
    }
}

