import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

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
    @Input() asPercent: boolean = false;

    @Output() isLoading = new EventEmitter<boolean>();

    private queryModelCopy;

    public xScale: d3.ScaleTime<any, any>;
    public showHint: boolean;

    private currentTimeCategory: string;
    private selectedData: Array<DateFrequencyPair>;
    private scaleDownThreshold: number = 10;
    private timeFormat: any = d3.timeFormat("%Y-%m-%d");

    ngOnInit() {
        this.setupZoomHint();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.chartElement == undefined) {
            this.chartElement = this.timelineContainer.nativeElement;
            this.calculateCanvas();
        }
        this.queryModelCopy = _.cloneDeep(this.queryModel);
        let min = new Date(this.visualizedField.searchFilter.currentData.min);
        let max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.calculateTimeCategory(min, max);
        this.xScale = scaleTimeCustom()
            .range([0, this.width])
            .clamp(true);
        this.prepareTimeline().then( () => {
            this.setupYScale();
            this.createChart(this.visualizedField.displayName);
            this.rescaleY(this.asPercent);
            this.drawChartData();
            this.setupBrushBehaviour();
        });

        //listen for changes in 'asPercent'
        if (changes['asPercent'] != undefined) {
            if (changes['asPercent'].previousValue != changes['asPercent'].currentValue) {
                this.rescaleY(this.asPercent);
            }
        }
    }

    async prepareTimeline() {
        this.isLoading.emit(true);
        await this.requestTimeData();
        this.dataService.pushCurrentTimelineData({ data: this.selectedData, timeInterval: this.currentTimeCategory });
        this.setDateRange();
        this.yMax = d3.max(this.selectedData.map(d => d.doc_count));
        this.isLoading.emit(false);
    }

    setDateRange() {   
        let min = new Date(this.visualizedField.searchFilter.currentData.min);
        let max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.xScale.domain(this.xDomain);
    }

    async requestTimeData() {
        /* date fields are returned with keys containing identifiers by elasticsearch
         replace with string representation, contained in 'key_as_string' field
        */
        let dataPromise = this.searchService.dateHistogramSearch(this.corpus, this.queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then( result => {
            return result.aggregations[this.visualizedField.name].filter( cat => cat.doc_count > 0).map( cat => {
                return {
                    date: new Date(cat.key_as_string),
                    doc_count: cat.doc_count
                }
            });
        });
        this.selectedData = await dataPromise;
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



    zoomIn() {
        let xExtent = this.xScale.domain();
        let previousTimeCategory = this.currentTimeCategory;
        this.calculateTimeCategory(xExtent[0], xExtent[1]);
        // check if xExtent, counted in current time category, is smaller than scaleDownThreshold
        if (this.currentTimeCategory == 'day' && previousTimeCategory == this.currentTimeCategory) {
            // zoom in without rearranging underlying data
            this.rescaleX();
            this.chart.selectAll('.bar')
                .transition().duration(750)
                .attr('x', d => this.xScale(d.date))
                .attr('y', d => this.yScale(d.doc_count))
                .attr('width', d => this.calculateBarWidth(d.date));
        }
        else {
            let filter = this.visualizedField.searchFilter;
            filter.currentData = { filterType: "DateFilter", min: this.timeFormat(xExtent[0]), max: this.timeFormat(xExtent[1]) };
            this.queryModelCopy.filters.push(filter);
            this.prepareTimeline().then( () => {
                this.setupYScale();
                this.yMax = d3.max(this.selectedData.map(d => d.doc_count));
                this.rescaleY(this.asPercent);
                this.drawChartData();
                this.rescaleX();
            });
        }
    }

    zoomOut() {
        this.currentTimeCategory = 'year';
        this.visualizedField.searchFilter.currentData = this.visualizedField.searchFilter.defaultData;
        this.prepareTimeline().then( () => {
            this.setDateRange();
            this.setupYScale();
            this.yMax = d3.max(this.selectedData.map(d => d.doc_count));
            this.rescaleY(this.asPercent);
            this.rescaleX();
            this.drawChartData();
            this.dataService.pushCurrentTimelineData({data: this.selectedData, timeInterval: this.currentTimeCategory});
        });
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

