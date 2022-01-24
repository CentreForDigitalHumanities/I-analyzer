import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import * as d3Scale from 'd3-scale';
import * as d3TimeFormat from 'd3-time-format';
import * as d3Time from 'd3-time';
import * as d3Array from 'd3-array';
import * as _ from 'lodash';

// custom definition of scaleTime to avoid Chrome issue with displaying historical dates
import { Corpus, DateFrequencyPair, QueryModel, DateResult } from '../models/index';
// import { default as scaleTimeCustom } from './timescale.js';
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
    @ViewChild('timeline', { static: true }) private timelineContainer: ElementRef;
    @Input() corpus: Corpus;
    @Input() queryModel: QueryModel;
    @Input() visualizedField;
    @Input() frequencyMeasure: 'documents'|'tokens' = 'documents';
    @Input() normalizer: 'raw' | 'percent' | 'documents'|'terms' = 'raw';

    @Output() isLoading = new EventEmitter<boolean>();
    @Output() totalTokenCountAvailable = new EventEmitter<boolean>();

    private queryModelCopy;

    public xScale: d3Scale.ScaleTime<any, any>;
    public showHint: boolean;

    @Input() documentLimit = 1000; // maximum number of documents to search through for term frequency
    binDocumentLimit: number;
    documentLimitExceeded = false; // whether some bins have more documents than the limit

    private currentTimeCategory: string;
    private rawData: DateResult[];
    private selectedData: Array<DateFrequencyPair>;
    private scaleDownThreshold = 10;
    private timeFormat: any = d3TimeFormat.timeFormat('%Y-%m-%d');

    ngOnInit() {
        this.setupZoomHint();
    }

    ngOnChanges(changes: SimpleChanges) {
        // doc counts should be requested if query has changed
        const loadDocCounts = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;

        // token counts should be requested if they are requested and not already present for this query
        const loadTokenCounts = (this.frequencyMeasure === 'tokens') && (loadDocCounts  || !(this.rawData.find(cat => cat.match_count)));

        if (this.chartElement === undefined) {
            this.chartElement = this.timelineContainer.nativeElement;
            this.calculateCanvas();
        }
        this.queryModelCopy = _.cloneDeep(this.queryModel);
        const min = new Date(this.visualizedField.searchFilter.currentData.min);
        const max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.calculateTimeCategory(min, max);
        this.xScale = d3Scale.scaleTime()
            .range([0, this.width])
            .clamp(true);
        this.prepareTimeline(loadDocCounts, loadTokenCounts).then(() => {
            this.setupYScale();
            this.createChart(this.visualizedField.displayName);
            this.rescaleY(this.normalizer === 'percent');
            this.drawChartData();
            this.setupBrushBehaviour();
        });

        // listen for changes in 'normalizer'
        if (changes['normalizer'] !== undefined) {
            if (changes['normalizer'].previousValue !== changes['normalizer'].currentValue) {
                this.rescaleY(this.normalizer === 'percent');
            }
        }
    }

    async prepareTimeline(loadDocCounts = false, loadTokenCounts = false) {
        this.isLoading.emit(true);

        if (loadDocCounts) { await this.requestDocumentData(); }
        if (loadTokenCounts) { await this.requestTermFrequencyData(); }

        this.selectData();

        this.dataService.pushCurrentTimelineData({ data: this.selectedData, timeInterval: this.currentTimeCategory });
        this.setDateRange();
        this.yMax = d3Array.max(this.selectedData.map(d => d.doc_count));
        this.totalCount = _.sumBy(this.selectedData, d => d.doc_count);
        this.isLoading.emit(false);
    }

    setDateRange() {
        const min = new Date(this.visualizedField.searchFilter.currentData.min);
        const max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.xScale.domain(this.xDomain);
    }

    async requestDocumentData() {
        let dataPromise: Promise<{date: Date, doc_count: number}[]>;

        /* date fields are returned with keys containing identifiers by elasticsearch
        replace with string representation, contained in 'key_as_string' field
        */
        dataPromise = this.searchService.dateHistogramSearch(
            this.corpus, this.queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result => {
                const data = result.aggregations[this.visualizedField.name].filter(cat => cat.doc_count > 0).map(cat => {
                    return {
                        date: new Date(cat.key_as_string),
                        doc_count: cat.doc_count
                    };
                });
                return data;
            });

        this.rawData = await dataPromise;
        this.binDocumentLimit = _.min([10000, _.round(this.documentLimit / this.rawData.length)]);
        this.documentLimitExceeded = this.rawData.find(d => d.doc_count > this.binDocumentLimit) !== undefined;
    }

    async requestTermFrequencyData() {
        const dataPromises = this.rawData.map((cat, index) => {
            return new Promise(resolve => {
                const start_date = cat.date;
                const end_date = index < (this.rawData.length - 1) ? this.rawData[index + 1].date : undefined;
                this.searchService.dateTermFrequencySearch(
                    this.corpus, this.queryModelCopy, this.visualizedField.name, this.binDocumentLimit,
                    start_date, end_date)
                    .then(result => {
                    const data = result.data;
                    this.rawData[index].match_count = data.match_count;
                    this.rawData[index].total_doc_count = data.doc_count;
                    this.rawData[index].token_count = data.token_count;
                    resolve(true);
                });
            });
        });

        await Promise.all(dataPromises);

        // signal if total token counts are available
        this.totalTokenCountAvailable.emit(this.rawData.find(cat => cat.token_count) !== undefined);

    }

    selectData(): void {
        if (this.frequencyMeasure === 'tokens') {
            if (this.normalizer === 'raw') {
                this.selectedData = this.rawData.map(cat =>
                    ({ date: cat.date, doc_count: cat.match_count }));
            } else if (this.normalizer === 'terms') {
                this.selectedData = this.rawData.map(cat =>
                    ({ date: cat.date, doc_count: cat.match_count / cat.token_count }));
            } else if (this.normalizer === 'documents') {
                this.selectedData = this.rawData.map(cat =>
                    ({ date: cat.date, doc_count: cat.match_count / cat.total_doc_count }));
            }
        } else {
            this.selectedData = this.rawData.map(cat =>
                ({ date: cat.date, doc_count: cat.doc_count }));
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

        // update existing bars
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
            .attr('width', d => this.calculateBarWidth(d.date))
            .attr('y', this.yScale(0)) // set to zero first for smooth transition
            .attr('height', 0)
            .transition().duration(750)
            .delay((d, i) => i * 10)
            .attr('y', d => this.yScale(d.doc_count))
            .attr('height', d => this.height - this.yScale(d.doc_count));
    }



    zoomIn() {
        const xExtent = this.xScale.domain();
        const previousTimeCategory = this.currentTimeCategory;
        this.calculateTimeCategory(xExtent[0], xExtent[1]);
        // check if xExtent, counted in current time category, is smaller than scaleDownThreshold
        if (this.currentTimeCategory === 'day' && previousTimeCategory === this.currentTimeCategory) {
            // zoom in without rearranging underlying data
            this.rescaleX();
            this.chart.selectAll('.bar')
                .transition().duration(750)
                .attr('x', d => this.xScale(d.date))
                .attr('y', d => this.yScale(d.doc_count))
                .attr('width', d => this.calculateBarWidth(d.date));
        }
        else {
            const filter = this.visualizedField.searchFilter;
            filter.currentData = { filterType: 'DateFilter', min: this.timeFormat(xExtent[0]), max: this.timeFormat(xExtent[1]) };
            this.queryModelCopy.filters.push(filter);
            this.prepareTimeline().then(() => {
                this.setupYScale();
                this.yMax = d3Array.max(this.selectedData.map(d => d.doc_count));
                this.rescaleY(this.normalizer === 'percent');
                this.drawChartData();
                this.rescaleX();
            });
        }
    }

    zoomOut() {
        this.currentTimeCategory = 'year';
        this.visualizedField.searchFilter.currentData = this.visualizedField.searchFilter.defaultData;
        this.prepareTimeline().then(() => {
            this.setDateRange();
            this.setupYScale();
            this.yMax = d3Array.max(this.selectedData.map(d => d.doc_count));
            this.rescaleY(this.normalizer === 'percent');
            this.rescaleX();
            this.drawChartData();
            this.dataService.pushCurrentTimelineData({ data: this.selectedData, timeInterval: this.currentTimeCategory });
        });
    }

    calculateTimeCategory(min: Date, max: Date) {
        if (d3Time.timeYear.count(min, max) >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'year';
            // this.timeFormat = d3.timeFormat("%Y");
        } else if (d3Time.timeMonth.count(min, max) >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'month';
            // this.timeFormat = d3.timeFormat("%B");
        } else if (d3Time.timeWeek.count(min, max) >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'week';
            // this.timeFormat = d3.timeFormat("%b %d");
        } else {
            this.currentTimeCategory = 'day';
            // this.timeFormat = d3.timeFormat("%a %d");
        }
    }

    calculateBarWidth(startDate: Date) {
        let endDate: Date;
        switch (this.currentTimeCategory) {
            case 'year':
                endDate = d3Time.timeYear.ceil(startDate);
                break;
            case 'month':
                endDate = d3Time.timeMonth.ceil(startDate);
                break;
            case 'week':
                endDate = d3Time.timeWeek.ceil(startDate);
                break;
            case 'day':
                endDate = d3Time.timeDay.ceil(startDate);
                break;
        }
        return this.xScale(endDate) - this.xScale(startDate);
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

