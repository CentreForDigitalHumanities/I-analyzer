import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import * as d3TimeFormat from 'd3-time-format';
import * as _ from 'lodash';


// custom definition of scaleTime to avoid Chrome issue with displaying historical dates
import { Corpus, DateFrequencyPair, QueryModel, DateResult, AggregateResult,
    visualizationField, freqTableHeaders, histogramOptions, TimelineSeriesRaw } from '../models/index';
// import { default as scaleTimeCustom } from './timescale.js';
import { BarChartComponent } from './barchart.component';
import * as moment from 'moment';
import { Chart, ChartOptions } from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';
import 'chartjs-adapter-moment';

@Component({
    selector: 'ia-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent extends BarChartComponent<TimelineSeriesRaw> implements OnChanges, OnInit {
    private currentTimeCategory: 'year'|'week'|'month'|'day';
    private scaleDownThreshold = 10;
    private timeFormat: any = d3TimeFormat.timeFormat('%Y-%m-%d');
    public xDomain: [Date, Date];


    ngOnChanges(changes: SimpleChanges) {
        // new doc counts should be requested if query has changed
        const refreshData = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;

        if (refreshData) {
            this.rawData = [
                this.newSeries(this.queryModel.queryText)
            ];
            this.setQueries();
            const min = new Date(this.visualizedField.searchFilter.currentData.min);
            const max = new Date(this.visualizedField.searchFilter.currentData.max);
            this.xDomain = [min, max];
            this.currentTimeCategory = this.calculateTimeCategory(min, max);
            this.prepareChart();
        }
    }

    async requestDocumentData() {
        /* date fields are returned with keys containing identifiers by elasticsearch
        replace with string representation, contained in 'key_as_string' field
        */
        const dataPromises = this.rawData.map((series, seriesIndex) => {
            if (!series.data.length) {
                this.requestSeriesDocumentData(series, seriesIndex).then(result => 
                    this.rawData[seriesIndex] = result
                );
                const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
                return this.searchService.dateHistogramSearch(
                    this.corpus, queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result => {
                    this.rawData[seriesIndex] = this.docCountResultIntoSeries(result, series, true);
                });
            }
        });

        await Promise.all(dataPromises);

        this.documentLimitExceeded = this.rawData.find(series => series.searchRatio < 1) !== undefined;
    }

    requestSeriesDocumentData(series: TimelineSeriesRaw, seriesIndex: number, setSearchRatio = true): Promise<TimelineSeriesRaw> {
        const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
        return this.searchService.dateHistogramSearch(
            this.corpus, queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result =>
                this.docCountResultIntoSeries(result, series, setSearchRatio)
        );

    }

    docCountResultIntoSeries(result, series: TimelineSeriesRaw, setSearchRatio = true): TimelineSeriesRaw {
        let data = result.aggregations[this.visualizedField.name]
            .map(this.aggregateResultToDateResult);
        const total_doc_count = this.totalDocCount(data);
        const searchRatio = setSearchRatio ? this.documentLimit / total_doc_count : series.searchRatio;
        data = this.includeTotalDocCount(data, total_doc_count);
        return {
            data: data,
            total_doc_count: total_doc_count,
            searchRatio: searchRatio,
            queryText: series.queryText,
        };
    }

    includeTotalDocCount(data: DateResult[], total: number): DateResult[] {
        return data.map(item => ({
            date: item.date,
            doc_count: item.doc_count,
            relative_doc_count: item.doc_count / total,
        }));
    }

    aggregateResultToDateResult(cat: AggregateResult): DateResult {
        return {
            date: new Date(cat.key_as_string),
            doc_count: cat.doc_count
        };
    }

    async requestTermFrequencyData() {
        const dataPromises = _.flatMap(this.rawData, ((series, seriesIndex) => {
            if (series.queryText && series.data[0].match_count === undefined) { // retrieve data if it was not already loaded
                return series.data.map((cat, index) => {
                    this.requestCategoryTermFrequencyData(cat, index, series, this.queryModel);
                });
            }
        }));

        await Promise.all(dataPromises);

        // signal if total token counts are available
        this.totalTokenCountAvailable = this.rawData.find(series => series.data.find(cat => cat.token_count)) !== undefined;
    }

    requestCategoryTermFrequencyData(cat: DateResult, catIndex: number, series: TimelineSeriesRaw, queryModel: QueryModel) {
        const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
        const timeDomain = this.categoryTimeDomain(cat, catIndex, series);
        const binDocumentLimit = this.documentLimitForCategory(cat, series);

        return this.searchService.dateTermFrequencySearch(
            this.corpus, queryModelCopy, this.visualizedField.name, binDocumentLimit,
            ...timeDomain)
            .then(result => this.addTermFrequencyToCategory(result, cat));

    }

    categoryTimeDomain(cat, catIndex, series): [Date, Date] {
        const startDate = cat.date;
        const endDate = catIndex < (series.data.length - 1) ? series.data[catIndex + 1].date : undefined;
        return [startDate, endDate];
    }

    setChart() {
        const datasets = this.rawData.map((series, seriesIndex) => {
            const data = this.chartDataFromSeries(series);
            return {
                xAxisID: 'xAxis',
                yAxisID: 'yAxis',
                label: series.queryText ? series.queryText : '(no query)',
                data: data,
                backgroundColor: this.colorPalette[seriesIndex],
                hoverBackgroundColor: this.colorPalette[seriesIndex],
            };
        });

        if (this.chart) {
            const unit = this.chart.options.scales.xAxis.time.unit as ('year'|'week'|'month'|'day');
            if (unit) {
                this.currentTimeCategory = unit;
            }
            this.chart.data.datasets = datasets;
            this.chart.options.plugins.legend.display = datasets.length > 1;
            this.chart.update();
        } else {
            this.initChart(datasets);
        }
    }

    chartDataFromSeries(series: TimelineSeriesRaw): {x: string, y: number}[] {
        const valueKey = this.currentValueKey;
        return series.data.map(item => ({
            x: item.date.toISOString(),
            y: item[valueKey],
        }));
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
        this.chart = new Chart('timeline',
            {
                type: 'bar',
                data: {
                    datasets: datasets
                },
                plugins: [ Zoom ],
                options: options
            }
        );

        this.chart.canvas.ondblclick = (event) => this.zoomOut();
    }

    zoomIn(chart, triggeredByDataUpdate = false) {
        const initialTimeCategory = this.calculateTimeCategory(...this.xDomain);
        const previousTimeCategory = this.currentTimeCategory;
        const min = new Date(chart.scales.xAxis.min);
        const max = new Date(chart.scales.xAxis.max);
        this.currentTimeCategory = this.calculateTimeCategory(min, max);

        if ((this.currentTimeCategory !== previousTimeCategory) ||
            (triggeredByDataUpdate && this.currentTimeCategory !== initialTimeCategory)) {
            this.showLoading(
                this.loadZoomedInData(
                    chart,
                    min, max,
                    triggeredByDataUpdate = triggeredByDataUpdate,
            ));
        }
    }

    async loadZoomedInData(chart, min: Date, max: Date, triggedByDataUpdate = false) {
        // when zooming, hide data for smooth transition
        chart.update(triggedByDataUpdate ? 'none' : 'hide');

        const docPromises: Promise<TimelineSeriesRaw>[] = chart.data.datasets.map((dataset, seriesIndex) => {
            const series = this.rawData[seriesIndex];
            const queryModelCopy = this.addQueryDateFilter(
                this.setQueryText(this.queryModel, series.queryText),
                min, max);

            return this.searchService.dateHistogramSearch(
                this.corpus, queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result => {
                    return this.docCountResultIntoSeries(result, series, false);
            });
        });

        const zoomedInResults = await Promise.all(docPromises);

        if (this.frequencyMeasure === 'tokens') {
            const dataPromises = _.flatMap(zoomedInResults, (series, seriesIndex) => {
                return series.data.map((cat, index) => {
                    const queryModelCopy = this.addQueryDateFilter(this.queryModel, min, max);
                    this.requestCategoryTermFrequencyData(cat, index, series, queryModelCopy);
                });
            });
            await Promise.all(dataPromises);
        }

        zoomedInResults.forEach((data, seriesIndex) => {
            chart.data.datasets[seriesIndex].data = this.chartDataFromSeries(data);
        });

        chart.options.scales.xAxis.time.unit = this.currentTimeCategory;
        chart.update('show'); // fade into view

    }

    addQueryDateFilter(query: QueryModel, min, max): QueryModel {
        const queryModelCopy = _.cloneDeep(query);
        // download zoomed in results
        const filter = this.visualizedField.searchFilter;
        filter.currentData = { filterType: 'DateFilter', min: this.timeFormat(min), max: this.timeFormat(max) };
        queryModelCopy.filters.push(filter);
        return queryModelCopy;
    }


    zoomOut(): void {
        this.chart.resetZoom();
        this.currentTimeCategory = this.calculateTimeCategory(...this.xDomain);
        this.chart.options.scales.xAxis.time.unit = this.currentTimeCategory;
        this.chart.update();

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

    setTableHeaders() {
        const rightColumnName = this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';
        const valueKey = this.currentValueKey;

        if (this.rawData.length > 1) {
            this.tableHeaders = [
                { key: 'date', label: 'Date', format: this.formatDate },
                { key: 'queryText', label: 'Query' },
                { key: valueKey, label: rightColumnName, format: this.formatValue }
            ];
        } else {
            this.tableHeaders = [
                { key: 'date', label: 'Date', format: this.formatDate },
                { key: valueKey, label: rightColumnName, format: this.formatValue }
            ];
        }
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

    get isZoomedIn(): boolean {
        // check whether this.chart is zoomed on xAxis

        if (this.chart) {
            const initialBounds = this.chart.getInitialScaleBounds().xAxis;
            const currentBounds = { min : this.chart.scales.xAxis.min, max: this.chart.scales.xAxis.max };

            return (initialBounds.min && initialBounds.min < currentBounds.min) ||
                (initialBounds.max && initialBounds.max > currentBounds.max);
        }
        return false;
    }

}
