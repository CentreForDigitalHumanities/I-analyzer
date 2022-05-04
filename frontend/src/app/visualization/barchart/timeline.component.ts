import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import * as d3TimeFormat from 'd3-time-format';
import * as _ from 'lodash';

import { QueryModel, DateResult, AggregateResult, TimelineSeries } from '../../models/index';
import { BarChartComponent } from './barchart.component';
import * as moment from 'moment';
import 'chartjs-adapter-moment';

@Component({
    selector: 'ia-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent extends BarChartComponent<DateResult> implements OnChanges, OnInit {
    /** time unit on the x-axis */
    private currentTimeCategory: 'year'|'week'|'month'|'day';
    /** threshold for scaling down a unit on the time scale */
    private scaleDownThreshold = 10;
    /** formatting function for time in ES queries */
    private timeFormat: any = d3TimeFormat.timeFormat('%Y-%m-%d'); // Todo: use moment instead of d3
    /** domain on the axis */
    public xDomain: [Date, Date];

    ngOnChanges(changes: SimpleChanges) {
        // new doc counts should be requested if query has changed
        if (this.changesRequireRefresh(changes)) {
            this.rawData = [
                this.newSeries(this.queryModel.queryText)
            ];
            if (this.chart) {
                // clear canvas an reset chart object
                this.chart.destroy();
                this.chart = undefined;
            }
            this.setQueries();
            this.setTimeDomain();
            this.prepareChart();
        }
    }

    /** get min/max date for the entire graph and set domain and time category */
    setTimeDomain() {
        const currentDomain = this.visualizedField.searchFilter.currentData;
        const min = new Date(currentDomain.min);
        const max = new Date(currentDomain.max);
        this.xDomain = [min, max];
        this.currentTimeCategory = this.calculateTimeCategory(min, max);
    }

    aggregateResultToResult(cat: AggregateResult): DateResult {
        /* date fields are returned with keys containing identifiers by elasticsearch
        replace with string representation, contained in 'key_as_string' field
        */
        return {
            date: new Date(cat.key_as_string),
            doc_count: cat.doc_count,
        };
    }

    /** Retrieve doc counts for a series.
     * @param series series object
     * @param setSearchRatio whether the `searchRatio` property of the series should be updated.
     * True when retrieving results for the entire series, false when retrieving a window.
     */
    requestSeriesDocumentData(series: TimelineSeries, setSearchRatio = true): Promise<TimelineSeries> {
        const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
        return this.searchService.dateHistogramSearch(
            this.corpus, queryModelCopy, this.visualizedField.name, this.currentTimeCategory).then(result =>
                this.docCountResultIntoSeries(result, series, setSearchRatio)
        );
    }

    requestCategoryTermFrequencyData(cat: DateResult, catIndex: number, series: TimelineSeries, queryModel = this.queryModel) {
        const queryModelCopy = this.setQueryText(queryModel, series.queryText);
        const timeDomain = this.categoryTimeDomain(cat, catIndex, series);
        const binDocumentLimit = this.documentLimitForCategory(cat, series);

        return this.searchService.dateTermFrequencySearch(
            this.corpus, queryModelCopy, this.visualizedField.name, binDocumentLimit,
            ...timeDomain)
            .then(result => this.addTermFrequencyToCategory(result, cat));

    }

    /** time domain for a bin */
    categoryTimeDomain(cat, catIndex, series): [Date, Date] {
        const startDate = cat.date;
        const endDate = catIndex < (series.data.length - 1) ? series.data[catIndex + 1].date : undefined;
        return [startDate, endDate];
    }

    setChart() {
        if (this.chart) {
            // reset time unit to the one set in the chart
            const unit = (this.chart.options.scales.xAxis as any).time.unit as ('year'|'week'|'month'|'day');
            if (unit) {
                this.currentTimeCategory = unit;
            }
            this.updateChartData();
        } else {
            this.initChart();
        }
    }

    getDatasets() {
        return this.rawData.map((series, seriesIndex) => {
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
    }

    /** turn a data series into a chartjs-compatible data array */
    chartDataFromSeries(series: TimelineSeries): {x: string, y: number}[] {
        const valueKey = this.currentValueKey;
        return series.data.map(item => ({
            x: item.date.toISOString(),
            y: item[valueKey],
        }));
    }

    chartOptions(datasets) {
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

        // zoom limits
        options.plugins.zoom.limits = {
            xAxis: {
                // convert dates to numeric rather than string here,
                // as zoom plugin does not accept strings
                min: xMin.valueOf(),
                max: xMax.valueOf(),
            }
        };

        options.scales.xAxis.type = 'time';
        options.plugins.legend = {display: datasets.length > 1};
        return options;
    }

    /**
     * Code that should be executed when zooming in, or when the chart data
     * is updated while already zoomed in.
     * Checks whether is is necessary to load zoomed-in data and does so if needed.
     * @param chart chart object
     * @param triggeredByDataUpdate whether the function was triggered by an update in the
     * underlying data.
     */
    onZoomIn(chart, triggeredByDataUpdate = false) {
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

    /**
     * load results for the zoomed-in window (using a narrower time category
     * than the zoomed-out chart)
     * @param chart chart object
     * @param min minimum date in window
     * @param max maximum date in window
     * @param triggeredByDataUpdate whether the function was triggered by an update in
     * the underlying data (affects animation only)
     */
    async loadZoomedInData(chart, min: Date, max: Date, triggeredByDataUpdate = false) {
        // when zooming, hide data for smooth transition
        chart.update(triggeredByDataUpdate ? 'none' : 'hide');

        const docPromises: Promise<TimelineSeries>[] = chart.data.datasets.map((dataset, seriesIndex) => {
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

    /**
     * Add a date filter to a query model restricting it to the provided min and max values.
     */
    addQueryDateFilter(query: QueryModel, min, max): QueryModel {
        const queryModelCopy = _.cloneDeep(query);
        // download zoomed in results
        const filter = this.visualizedField.searchFilter;
        filter.currentData = { filterType: 'DateFilter', min: this.timeFormat(min), max: this.timeFormat(max) };
        queryModelCopy.filters.push(filter);
        return queryModelCopy;
    }

    /** trigger zoom out, update chart data accordingly */
    zoomOut(): void {
        this.chart.resetZoom();
        this.currentTimeCategory = this.calculateTimeCategory(...this.xDomain);
        (this.chart.options.scales.xAxis as any).time.unit = this.currentTimeCategory;
        this.chart.update();

        this.setChart();
    }

    /**
     * Get the time category (year/month/week/day) that should be used in the graph,
     * based on minimum and maximum dates on the x axis.
     */
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
                { key: valueKey, label: rightColumnName, format: this.formatValue,  formatDownload: this.formatDownloadValue  }
            ];
        } else {
            this.tableHeaders = [
                { key: 'date', label: 'Date', format: this.formatDate },
                { key: valueKey, label: rightColumnName, format: this.formatValue }
            ];
        }
    }

    /**
     * Format for dates based on the time category.
     * Returns a formatting function.
     */
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
