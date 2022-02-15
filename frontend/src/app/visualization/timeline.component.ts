import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import * as d3TimeFormat from 'd3-time-format';
import * as _ from 'lodash';


// custom definition of scaleTime to avoid Chrome issue with displaying historical dates
import { Corpus, DateFrequencyPair, QueryModel, DateResult, TimelineDataPoint,
    visualizationField, freqTableHeaders, histogramOptions } from '../models/index';
// import { default as scaleTimeCustom } from './timescale.js';
import { BarChartComponent } from './barchart.component';
import * as moment from 'moment';
import { Chart, ChartOptions } from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';
import 'chartjs-adapter-moment';

const hintSeenSessionStorageKey = 'hasSeenTimelineZoomingHint';
const hintHidingMinDelay = 500;       // milliseconds
const hintHidingDebounceTime = 1000;  // milliseconds

@Component({
    selector: 'ia-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent extends BarChartComponent implements OnChanges, OnInit {
    private queryModelCopy;

    public showHint: boolean;

    private currentTimeCategory: 'year'|'week'|'month'|'day';
    private rawData: DateResult[];
    private selectedData: TimelineDataPoint[];
    private scaleDownThreshold = 10;
    private timeFormat: any = d3TimeFormat.timeFormat('%Y-%m-%d');
    public xDomain: [Date, Date];

    timeline: any;

    ngOnInit() {
        this.setupZoomHint();
    }

    ngOnChanges(changes: SimpleChanges) {
        // doc counts should be requested if query has changed
        const loadDocCounts = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;
        const loadTokenCounts = (this.frequencyMeasure === 'tokens') && loadDocCounts;

        this.queryModelCopy = _.cloneDeep(this.queryModel);
        const min = new Date(this.visualizedField.searchFilter.currentData.min);
        const max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.calculateTimeCategory(min, max);
        this.prepareTimeline(loadDocCounts, loadTokenCounts);
    }

    onOptionChange(options: histogramOptions) {
        this.frequencyMeasure = options.frequencyMeasure;
        this.normalizer = options.normalizer;

        if (this.rawData && this.timeline) {
            if (this.frequencyMeasure === 'tokens' && !this.rawData.find(cat => cat.match_count)) {
                this.prepareTimeline(false, true);
            } else {
                this.prepareTimeline(false, false);
            }
            if (this.timeline.isZoomedOrPanned()) {
                this.loadZoomedInData(this.timeline, true);
            }
        }
    }

    async prepareTimeline(loadDocCounts = false, loadTokenCounts = false) {
        this.isLoading.emit(true);

        if (loadDocCounts) { await this.requestDocumentData(); }
        if (loadTokenCounts) { await this.requestTermFrequencyData(); }

        this.selectedData = this.selectData(this.rawData);

        if (!this.selectedData.length) {
            this.error.emit({message: 'No results'});
        }

        this.setChart();
        this.isLoading.emit(false);
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
        const total_documents = _.sum(this.rawData.map(d => d.doc_count));
        this.searchRatioDocuments = this.documentLimit / total_documents;
        this.documentLimitExceeded = this.documentLimit < total_documents;
    }

    async requestTermFrequencyData() {
        const dataPromises = this.rawData.map((cat, index) => {
            return new Promise(resolve => {
                const start_date = cat.date;
                const binDocumentLimit = _.min([10000, _.ceil(this.rawData[index].doc_count * this.searchRatioDocuments)]);
                const end_date = index < (this.rawData.length - 1) ? this.rawData[index + 1].date : undefined;
                this.searchService.dateTermFrequencySearch(
                    this.corpus, this.queryModelCopy, this.visualizedField.name, binDocumentLimit,
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
        this.totalTokenCountAvailable = this.rawData.find(cat => cat.token_count) !== undefined;
    }

    selectData(rawData: DateResult[], total_doc_count?: number): TimelineDataPoint[] {
        if (this.frequencyMeasure === 'tokens') {
            if (this.normalizer === 'raw') {
                return rawData.map(cat =>
                    ({ date: cat.date, value: cat.match_count }));
            } else if (this.normalizer === 'terms') {
                return rawData.map(cat =>
                    ({ date: cat.date, value: cat.match_count / cat.token_count }));
            } else if (this.normalizer === 'documents') {
                return rawData.map(cat =>
                    ({ date: cat.date, value: cat.match_count / cat.total_doc_count }));
            }
        } else {
            if (this.normalizer === 'raw') {
                return rawData.map(cat =>
                    ({ date: cat.date, value: cat.doc_count }));
            } else {
                total_doc_count = total_doc_count || rawData.reduce((s, f) => s + f.doc_count, 0);
                return rawData.map(cat =>
                    ({ date: cat.date, value: cat.doc_count / total_doc_count }));
            }

        }
    }

    setChart() {
        const data = this.selectedData.map((item) => ({
            x: item.date.toISOString(),
            y: item.value,
        }));

        const datasets = [
            {
                xAxisID: 'xAxis',
                yAxisID: 'yAxis',
                label: this.queryModel && this.queryModel.queryText ? this.queryModel.queryText : '(no query)',
                data: data,
            }
        ];

        if (this.timeline) {
            if (this.timeline.options.scales.xAxis.time.unit as ('year'|'week'|'month'|'day')) {
                this.currentTimeCategory = this.timeline.options.scales.xAxis.time.unit as ('year'|'week'|'month'|'day');
            }
            this.timeline.data.datasets = datasets;
            this.timeline.update();
        } else {
            this.initChart(datasets);
        }

    }

    initChart(datasets) {
        const xAxisLabel = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const margin = moment.duration(1, this.currentTimeCategory);
        const xMin = moment(this.xDomain[0]).subtract(margin).toDate();
        const xMax = moment(this.xDomain[1]).add(margin).toDate();

        const options = this.basicChartOptions;
        const xAxis = options.scales.xAxis;
        (xAxis as any).title.text = xAxisLabel;
        xAxis.type = 'time';
        (xAxis as any).time = {
            minUnit: 'day',
            unit: this.currentTimeCategory,
        };
        xAxis.min = xMin.toISOString();
        xAxis.max = xMax.toISOString();
        options.plugins.tooltip = {
            callbacks: {
                title: ([tooltipItem]) => {
                    return this.formatDate(Date.parse(tooltipItem.label as string));
                },
                label: (tooltipItem) => {
                    const value = (tooltipItem.raw as {t: Date, y: number}).y;
                    return this.formatValue(value);
                }
            }
        };

        options.scales.xAxis.type = 'time';
        this.timeline = new Chart('timeline',
            {
                type: 'bar',
                data: {
                    datasets: datasets
                },
                plugins: [ Zoom ],
                options: options
            }
        );

        this.timeline.canvas.ondblclick = (event) => this.zoomOut();

    }

    async loadZoomedInData(chart, triggedByDataUpdate = false) {
        const previousTimeCategory = this.currentTimeCategory;
        const min = new Date(chart.scales.xAxis.min);
        const max = new Date(chart.scales.xAxis.max);
        this.calculateTimeCategory(min, max);

        if (triggedByDataUpdate || (this.currentTimeCategory !== previousTimeCategory)) {
            this.isLoading.emit(true);
            const dataset = chart.data.datasets[0];

            // hide data for smooth transition
            chart.update(triggedByDataUpdate ? 'none' : 'hide');

            // download zoomed in results
            const filter = this.visualizedField.searchFilter;
            filter.currentData = { filterType: 'DateFilter', min: this.timeFormat(min), max: this.timeFormat(max) };
            this.queryModelCopy.filters.push(filter);

            let zoomedInResults: DateResult[];

            const getDocCounts = this.searchService.dateHistogramSearch(
                this.corpus, this.queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result => {
                const data = result.aggregations[this.visualizedField.name].filter(cat => cat.doc_count > 0).map(cat => {
                    return {
                        date: new Date(cat.key_as_string),
                        doc_count: cat.doc_count
                    };
                });
                return data;
            });

            zoomedInResults = await getDocCounts;

            if (this.frequencyMeasure === 'tokens') {
                const dataPromises = zoomedInResults.map((cat, index) => {
                    return new Promise(resolve => {
                        const start_date = cat.date;
                        const binDocumentLimit = _.min([10000, _.ceil(zoomedInResults[index].doc_count * this.searchRatioDocuments)]);
                        const end_date = index < (zoomedInResults.length - 1) ? zoomedInResults[index + 1].date : max;
                        this.searchService.dateTermFrequencySearch(
                            this.corpus, this.queryModelCopy, this.visualizedField.name, binDocumentLimit,
                            start_date, end_date)
                            .then(result => {
                            const data = result.data;
                            zoomedInResults[index].match_count = data.match_count;
                            zoomedInResults[index].total_doc_count = data.doc_count;
                            zoomedInResults[index].token_count = data.token_count;
                            resolve(true);
                        });
                    });
                });
                await Promise.all(dataPromises);
            }

            const selectedData = this.selectData(zoomedInResults,
                this.rawData.reduce((s, f) => s + f.doc_count, 0)); // add overall total for percentages

            // insert results in graph
            dataset.data = selectedData.map((item) => ({x: item.date.toISOString(), y: item.value}));
            chart.scales.xAxis.options.time.unit = this.currentTimeCategory;
            chart.update('show'); // fade into view
            this.isLoading.emit(false);
        }
    }

    zoomOut(): void {
        this.timeline.resetZoom();
        this.calculateTimeCategory(this.xDomain[0], this.xDomain[1]);
        this.timeline.options.scales.xAxis.time.unit = this.currentTimeCategory;
        this.timeline.update();

        this.setChart();
    }

    public calculateTimeCategory(min: Date, max: Date) {
        const diff = moment.duration(moment(max).diff(moment(min)));
        if (diff.asYears() >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'year';
        } else if (diff.asMonths() >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'month';
        } else if (diff.asWeeks() >= this.scaleDownThreshold) {
            this.currentTimeCategory = 'week';
        } else {
            this.currentTimeCategory = 'day';
        }
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

    get tableHeaders(): freqTableHeaders {
        const rightColumnName = this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';
        const formatDateValue = this.formatDate;

        let formatValue: (value: number) => string | undefined;
        if (this.normalizer === 'percent') {
            formatValue = (value: number) => {
                return `${_.round(100 * value, 1)}%`;
            };
        }

        return [
            { key: 'date', label: 'Date', format: formatDateValue },
            { key: 'value', label: rightColumnName, format: formatValue }
        ];
    }

    get formatDate(): (date) => string {
        let dateFormat: string;
        switch (this.currentTimeCategory) {
            case 'year':
                dateFormat = "YYYY";
                break;
            case 'month':
                dateFormat = "MMMM YYYY";
                break;
            default:
                dateFormat = "YYYY-MM-DD";
                break;
        }

        return (date: Date) => {
            return moment(date).format(dateFormat);
        };
    }
}
