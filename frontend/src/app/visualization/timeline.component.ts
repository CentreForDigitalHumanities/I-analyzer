import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import * as d3TimeFormat from 'd3-time-format';
import * as _ from 'lodash';


// custom definition of scaleTime to avoid Chrome issue with displaying historical dates
import { Corpus, DateFrequencyPair, QueryModel, DateResult, TimelineDataPoint,
    visualizationField, freqTableHeaders, histogramOptions, TimelineSeries, TimelineSeriesRaw } from '../models/index';
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
    public showHint: boolean;

    private currentTimeCategory: 'year'|'week'|'month'|'day';
    private rawData: TimelineSeriesRaw[];
    private selectedData: TimelineSeries[];
    private scaleDownThreshold = 10;
    private timeFormat: any = d3TimeFormat.timeFormat('%Y-%m-%d');
    public xDomain: [Date, Date];

    timeline: any;

    ngOnInit() {
        this.setupZoomHint();
    }

    ngOnChanges(changes: SimpleChanges) {
        // new doc counts should be requested if query has changed
        const refreshData = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;

        if (refreshData) {
            this.rawData = [
                {
                    queryText: this.queryModel.queryText,
                    data: [],
                    total_doc_count: 0,
                    searchRatio: 1.0,
                }
            ];
        }

        const min = new Date(this.visualizedField.searchFilter.currentData.min);
        const max = new Date(this.visualizedField.searchFilter.currentData.max);
        this.xDomain = [min, max];
        this.currentTimeCategory = this.calculateTimeCategory(min, max);
        this.prepareTimeline();
    }

    onOptionChange(options: histogramOptions) {
        this.frequencyMeasure = options.frequencyMeasure;
        this.normalizer = options.normalizer;

        if (this.rawData && this.timeline) {
            this.prepareTimeline();
        }
    }

    addSeries(queryText: string) {
        this.rawData.push(this.newSeries(queryText));
        this.prepareTimeline();
    }

    async prepareTimeline() {
        this.isLoading.emit(true);

        await this.requestDocumentData();
        if (this.frequencyMeasure === 'tokens') { await this.requestTermFrequencyData(); }

        this.selectedData = this.selectData(this.rawData);

        if (!this.selectedData.length) {
            this.error.emit({message: 'No results'});
        }

        this.setChart();

        if (this.isZoomedIn) {
            this.loadZoomedInData(this.timeline, true);
        }

        this.isLoading.emit(false);
    }

    async requestDocumentData() {
        /* date fields are returned with keys containing identifiers by elasticsearch
        replace with string representation, contained in 'key_as_string' field
        */
        const dataPromises = this.rawData.map((series, seriesIndex) => {
            if (!series.data.length) {
                const queryModelCopy = _.cloneDeep(this.queryModel);
                queryModelCopy.queryText = series.queryText;
                return this.searchService.dateHistogramSearch(
                    this.corpus, queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result => {
                    const data = result.aggregations[this.visualizedField.name].filter(cat => cat.doc_count > 0).map(cat => {
                        return {
                            date: new Date(cat.key_as_string),
                            doc_count: cat.doc_count
                        };
                    });
                    const total_doc_count = _.sumBy(data, (item) => item.doc_count);
                    const searchRatio = this.documentLimit / total_doc_count;
                    this.rawData[seriesIndex] = {
                        data: data,
                        total_doc_count: total_doc_count,
                        searchRatio: searchRatio,
                        queryText: series.queryText,
                    };
                });
            }
        });

        await Promise.all(dataPromises);

        this.documentLimitExceeded = this.rawData.find(series => series.searchRatio < 1) !== undefined;
    }

    async requestTermFrequencyData() {
        const dataPromises = _.flatMap(this.rawData, ((series, seriesIndex) => {
            if (series.data[0].match_count === undefined) { // retrieve data if it was not already loaded
                const queryModelCopy = _.cloneDeep(this.queryModel);
                queryModelCopy.queryText = series.queryText;
                series.data.map((cat, index) => {
                    return new Promise(resolve => {
                        const start_date = cat.date;
                        const binDocumentLimit = _.min([10000, _.ceil(cat.doc_count * series.searchRatio)]);
                        const end_date = index < (series.data.length - 1) ? series.data[index + 1].date : undefined;
                        this.searchService.dateTermFrequencySearch(
                            this.corpus, queryModelCopy, this.visualizedField.name, binDocumentLimit,
                            start_date, end_date)
                            .then(result => {
                            const data = result.data;
                            cat.match_count = data.match_count;
                            cat.total_doc_count = data.doc_count;
                            cat.token_count = data.token_count;
                            resolve(true);
                        });
                    });
                });
            }
        }));

        await Promise.all(dataPromises);

        // signal if total token counts are available
        this.totalTokenCountAvailable = this.rawData.find(series => series.data.find(cat => cat.token_count)) !== undefined;
    }

    selectData(rawData: TimelineSeriesRaw[]): TimelineSeries[] {
        const valueFuncs = {
            tokens: {
                raw: (item, series) => item.match_count,
                terms: (item, series) => item.match_count / item.token_count,
                documents: (item, series) => item.match_count / item.total_doc_count
            },
            documents: {
                raw: (item, series) => item.doc_count,
                percent: (item, series) => item.doc_count / series.total_doc_count
            }
        };

        const getValue: (item: DateResult, series: TimelineSeriesRaw) => number
            = valueFuncs[this.frequencyMeasure][this.normalizer];

        return rawData.map(series => {
            const data = series.data.map(item => ({
                date: item.date,
                value: getValue(item, series) || 0
            }));
            return {label: series.queryText, data: data};
        });
    }

    setChart() {
        const datasets = this.selectedData.map((series, seriesIndex) => {
            const data = series.data.map(item => ({
                x: item.date.toISOString(),
                y: item.value,
            }));
            return {
                xAxisID: 'xAxis',
                yAxisID: 'yAxis',
                label: series.label ? series.label : '(no query)',
                data: data,
                backgroundColor: this.colorPalette[seriesIndex],
                hoverBackgroundColor: this.colorPalette[seriesIndex],
            };
        });

        if (this.timeline) {
            if (this.timeline.options.scales.xAxis.time.unit as ('year'|'week'|'month'|'day')) {
                this.currentTimeCategory = this.timeline.options.scales.xAxis.time.unit as ('year'|'week'|'month'|'day');
            }
            this.timeline.data.datasets = datasets;
            this.timeline.options.plugins.legend.display = datasets.length > 1;
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
                    const value = tooltipItem.parsed.y;
                    return this.formatValue(value);
                }
            }
        };

        options.scales.xAxis.type = 'time';
        options.plugins.legend = {display: datasets.length > 1};
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
        const initialTimeCategory = this.calculateTimeCategory(this.xDomain[0], this.xDomain[1]);
        const previousTimeCategory = this.currentTimeCategory;
        const min = new Date(chart.scales.xAxis.min);
        const max = new Date(chart.scales.xAxis.max);
        this.currentTimeCategory = this.calculateTimeCategory(min, max);

        if ((this.currentTimeCategory !== previousTimeCategory) ||
            (triggedByDataUpdate && this.currentTimeCategory !== initialTimeCategory)) {
            this.isLoading.emit(true);

            // hide data for smooth transition
            chart.update(triggedByDataUpdate ? 'none' : 'hide');

            let zoomedInResults: TimelineSeriesRaw[];
            const docPromises: Promise<TimelineSeriesRaw>[] = chart.data.datasets.map((dataset, seriesIndex) => {
                const series = this.rawData[seriesIndex];
                const queryModelCopy = _.cloneDeep(this.queryModel);
                queryModelCopy.queryText = series.queryText;
                const filter = this.visualizedField.searchFilter;
                filter.currentData = { filterType: 'DateFilter', min: this.timeFormat(min), max: this.timeFormat(max) };
                queryModelCopy.filters.push(filter);

                return this.searchService.dateHistogramSearch(
                    this.corpus, queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result => {
                    const data = result.aggregations[this.visualizedField.name].filter(cat => cat.doc_count > 0).map(cat => {
                        return {
                            date: new Date(cat.key_as_string),
                            doc_count: cat.doc_count
                        };
                    });
                    const total_doc_count = _.sumBy(data, (item) => item.doc_count);
                    return {
                        data: data,
                        total_doc_count: total_doc_count,
                        searchRatio: series.searchRatio,
                        queryText: series.queryText,
                    };
                });
            });

            zoomedInResults = await Promise.all(docPromises);

            if (this.frequencyMeasure === 'tokens') {
                const dataPromises = _.flatMap(zoomedInResults, (series, seriesIndex) => {
                    return series.data.map((cat, index) => {
                        const queryModelCopy = _.cloneDeep(this.queryModel);
                        queryModelCopy.queryText = series.queryText;
                        // download zoomed in results
                        const filter = this.visualizedField.searchFilter;
                        filter.currentData = { filterType: 'DateFilter', min: this.timeFormat(min), max: this.timeFormat(max) };
                        queryModelCopy.filters.push(filter);
                        return new Promise(resolve => {
                            const start_date = cat.date;
                            const binDocumentLimit = _.min([10000, _.ceil(cat.doc_count * series.searchRatio)]);
                            const end_date = index < (series.data.length - 1) ? series.data[index + 1].date : max;
                            this.searchService.dateTermFrequencySearch(
                                this.corpus, queryModelCopy, this.visualizedField.name, binDocumentLimit,
                                start_date, end_date)
                                .then(result => {
                                const data = result.data;
                                series.data[index].match_count = data.match_count;
                                series.data[index].total_doc_count = data.doc_count;
                                series.data[index].token_count = data.token_count;
                                resolve(true);
                            });
                        });
                    });
                });
                await Promise.all(dataPromises);
            }

            const selectedData: TimelineSeries[] = this.selectData(zoomedInResults);

            selectedData.forEach((data, seriesIndex) => {
                chart.data.datasets[seriesIndex].data = data.data.map((item: TimelineDataPoint) => ({
                    x: item.date.toISOString(),
                    y: item.value,
                }));
            });

            chart.options.scales.xAxis.time.unit = this.currentTimeCategory;
            chart.update('show'); // fade into view
            this.isLoading.emit(false);
        }
    }

    zoomOut(): void {
        this.timeline.resetZoom();
        this.currentTimeCategory = this.calculateTimeCategory(this.xDomain[0], this.xDomain[1]);
        this.timeline.options.scales.xAxis.time.unit = this.currentTimeCategory;
        this.timeline.update();

        this.setChart();
    }

    public calculateTimeCategory(min: Date, max: Date): 'year'|'month'|'week'|'day' {
        const diff = moment.duration(moment(max).diff(moment(min)));
        if (diff.asYears() >= this.scaleDownThreshold) {
            return 'year';
        } else if (diff.asMonths() >= this.scaleDownThreshold) {
            return 'month';
        } else if (diff.asWeeks() >= this.scaleDownThreshold) {
            return 'week';
        } else {
            return 'day';
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

    get percentageDocumentsSearched() {
        return _.round(100 *  _.max(this.rawData.map(series => series.searchRatio)));
    }

    get isZoomedIn(): boolean {
        // check whether this.timeline is zoomed on xAxis

        if (this.timeline) {
            const initialBounds = this.timeline.getInitialScaleBounds().xAxis;
            const currentBounds = { min : this.timeline.scales.xAxis.min, max: this.timeline.scales.xAxis.max };

            return (initialBounds.min && initialBounds.min < currentBounds.min) ||
                (initialBounds.max && initialBounds.max > currentBounds.max);
        }
        return false;
    }

    get queries(): string[] {
        return this.rawData.map(series => series.queryText);
    }
}
