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
    private queryModelCopy;

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
            if (this.frequencyMeasure === 'tokens' && !this.rawData.find(series => (series.data.find((cat) => cat.match_count)))) {
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
        let dataPromise: Promise<TimelineSeriesRaw[]>;

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
                const total_doc_count = _.sumBy(data, (item) => item.doc_count);
                const searchRatio = this.documentLimit / total_doc_count;
                return [{data: data, total_doc_count: total_doc_count, searchRatio: searchRatio }];
            });

        this.rawData = await dataPromise;

        this.documentLimitExceeded = this.rawData.find(series => series.searchRatio < 1) !== undefined;
    }

    async requestTermFrequencyData() {
        const dataPromises = _.flatMap(this.rawData, ((series, seriesIndex) => {
            series.data.map((cat, index) => {
                return new Promise(resolve => {
                    const start_date = cat.date;
                    const binDocumentLimit = _.min([10000, _.ceil(cat.doc_count * series.searchRatio)]);
                    const end_date = index < (this.rawData.length - 1) ? series[index + 1].date : undefined;
                    this.searchService.dateTermFrequencySearch(
                        this.corpus, this.queryModelCopy, this.visualizedField.name, binDocumentLimit,
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
        }));

        await Promise.all(dataPromises);

        // signal if total token counts are available
        this.totalTokenCountAvailable = this.rawData.find(series => series.data.find(cat => cat.token_count)) !== undefined;
    }

    selectData(rawData: TimelineSeriesRaw[]): TimelineSeries[] {
        let getValue: (item: DateResult, series: TimelineSeriesRaw) => number;
        switch ([this.frequencyMeasure, this.normalizer]) {
            case ['tokens', 'raw']:
                getValue = (item, series) => item.match_count;
                break;

            case ['tokens', 'terms']:
                getValue = (item, series) => item.match_count / item.token_count;
                break;

            case ['tokens', 'documents']:
                getValue = (item, series) => item.match_count / item.token_count;
                break;

            case ['documents', 'percent']:
                getValue = (item, series) => item.match_count / series.total_doc_count;
                break;

            default:
                getValue = (item, series) => item.doc_count;
                break;
        }

        return rawData.map(series => {
            const data = series.data.map(item => ({
                date: item.date,
                value: getValue(item, series)
            }));
            return {label: series.label, data: data};
        });
    }

    setChart() {

        const datasets = this.selectedData.map(series => {
            const data = series.data.map(item => ({
                x: item.date.toISOString(),
                y: item.value,
            }));
            return {
                xAxisID: 'xAxis',
                yAxisID: 'yAxis',
                label: series.label,
                data: data,
            };
        });

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

            // hide data for smooth transition
            chart.update(triggedByDataUpdate ? 'none' : 'hide');

            chart.data.datasets.forEach(async (dataset, seriesIndex) => {
                const series = this.rawData[seriesIndex];
                // download zoomed in results
                const filter = this.visualizedField.searchFilter;
                filter.currentData = { filterType: 'DateFilter', min: this.timeFormat(min), max: this.timeFormat(max) };
                this.queryModelCopy.filters.push(filter);


                let zoomedInResults: TimelineSeriesRaw;

                const docCounts = this.searchService.dateHistogramSearch(
                    this.corpus, this.queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result => {
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
                    };
                });

                zoomedInResults = await docCounts;

                if (this.frequencyMeasure === 'tokens') {
                    const dataPromises = zoomedInResults.data.map((cat, index) => {
                        return new Promise(resolve => {
                            const start_date = cat.date;
                            const binDocumentLimit = _.min([10000, _.ceil(cat.doc_count * series.searchRatio)]);
                            const end_date = index < (zoomedInResults.data.length - 1) ? zoomedInResults.data[index + 1].date : max;
                            this.searchService.dateTermFrequencySearch(
                                this.corpus, this.queryModelCopy, this.visualizedField.name, binDocumentLimit,
                                start_date, end_date)
                                .then(result => {
                                const data = result.data;
                                zoomedInResults.data[index].match_count = data.match_count;
                                zoomedInResults.data[index].total_doc_count = data.doc_count;
                                zoomedInResults.data[index].token_count = data.token_count;
                                resolve(true);
                            });
                        });
                    });
                    await Promise.all(dataPromises);
                }

                const selectedData: TimelineSeries = this.selectData([zoomedInResults])[0];
                dataset.data = selectedData.data.map((item: TimelineDataPoint) => ({
                    x: item.date.toISOString(),
                    y: item.value,
                }));

            });

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

    get percentageDocumentsSearched() {
        return _.round(100 *  _.max(this.rawData.map(series => series.searchRatio)));
    }

}
