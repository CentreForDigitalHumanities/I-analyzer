import { Component, OnChanges, OnInit } from '@angular/core';

import * as _ from 'lodash';
import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';
import 'chartjs-adapter-moment';

import {
    QueryModel,
    TimelineSeries,
    TimeCategory,
    DateFilterData,
} from '@models/index';
import { BarchartDirective } from './barchart.directive';

import { selectColor } from '@utils/select-color';
import { showLoading } from '@utils/utils';
import { TimelineData } from './results-count';


@Component({
    selector: 'ia-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    standalone: false
})
export class TimelineComponent
    extends BarchartDirective<TimelineData>
    implements OnChanges, OnInit {
    /** domain on the axis */
    public xDomain: [Date, Date];
    /** time unit on the x-axis */
    private currentTimeCategory: TimeCategory;

    initData(): TimelineData {
        return new TimelineData(
            this.queryModel,
            this.comparedQueries,
            this.frequencyMeasure,
            this.visualizedField,
            this.searchService,
            this.apiService,
            this.visualizationService,
            this.destroy$,
        );
    }

    /** get min/max date for the entire graph and set domain and time category */
    setTimeDomain() {
        const filter = this.queryModel.filterForField(this.visualizedField)
            || this.visualizedField.makeSearchFilter();
        const currentDomain = filter.currentData as DateFilterData;
        const min = new Date(currentDomain.min);
        const max = new Date(currentDomain.max);
        this.xDomain = [min, max];
        this.currentTimeCategory = this.data.calculateTimeCategory(min, max);
    }

    /** time domain for a bin */
    categoryTimeDomain(cat, catIndex, series): [Date, Date] {
        const startDate = cat.date;
        const endDate =
            catIndex < series.data.length - 1
                ? series.data[catIndex + 1].date
                : undefined;
        return [startDate, endDate];
    }

    setChart() {
        if (this.chart) {
            // reset time unit to the one set in the chart
            const unit = (this.chart.options.scales.x as any).time
                .unit as TimeCategory;
            if (unit) {
                this.currentTimeCategory = unit;
            }
            this.updateChartData();
        } else {
            this.initChart();
        }
    }

    getDatasets() {
        return this.data.rawData$.value.map((series, seriesIndex) => {
            const data = this.chartDataFromSeries(series);
            return {
                type: this.chartType,
                label: series.queryText ? series.queryText : '(no query)',
                data,
                backgroundColor: selectColor(this.palette, seriesIndex),
                hoverBackgroundColor: selectColor(this.palette, seriesIndex),
                borderColor: selectColor(this.palette, seriesIndex),
                borderWidth: 1,
                pointRadius: 2.5,
                pointHoverRadius: 5,
            };
        });
    }

    /** turn a data series into a chartjs-compatible data array */
    chartDataFromSeries(series: TimelineSeries): { x: string; y: number }[] {
        const valueKey = this.currentValueKey;
        return series.data.map((item) => ({
            x: item.date.toISOString(),
            y: item[valueKey],
        }));
    }

    callibratexAxis(date: Date, margin: number = 1) {
        switch (this.data.currentTimeCategory) {
            case 'day':
                return addDays(date, margin);
            case 'week':
                return addWeeks(date, margin);
            case 'month':
                return addMonths(date, margin);
            case 'year':
                return addYears(date, margin);

        }
    }

    chartOptions(datasets) {
        const xLabel = this.visualizedField.displayName
            ? this.visualizedField.displayName
            : this.visualizedField.name;
        const xMin = this.callibratexAxis(this.xDomain[0], -1);
        const xMax = this.callibratexAxis(this.xDomain[1]);

        const options = this.basicChartOptions;
        options.plugins.title.text = this.chartTitle();
        const x = options.scales.x;
        (x as any).title.text = xLabel;
        x.type = 'time';
        (x as any).time = {
            minUnit: 'day',
            unit: this.data.currentTimeCategory,
        };
        x.min = xMin.toISOString();
        x.max = xMax.toISOString();
        options.plugins.tooltip = {
            callbacks: {
                title: ([tooltipItem]) =>
                    this.formatDate(Date.parse(tooltipItem.label as string)),
                label: (tooltipItem) => {
                    const value = tooltipItem.parsed.y;
                    return this.formatValue(this.normalizer)(value);
                },
            },
        };

        // zoom limits
        options.plugins.zoom.limits = {
            x: {
                // convert dates to numeric rather than string here,
                // as zoom plugin does not accept strings
                min: xMin.valueOf(),
                max: xMax.valueOf(),
            },
        };

        options.scales.x.type = 'time';
        options.plugins.legend = { display: datasets.length > 1 };
        return options;
    }

    /**
     * Code that should be executed when zooming in, or when the chart data
     * is updated while already zoomed in.
     * Checks whether is is necessary to load zoomed-in data and does so if needed.
     *
     * @param chart chart object
     * @param triggeredByDataUpdate whether the function was triggered by an update in the
     * underlying data.
     */
    onZoomIn(chart, triggeredByDataUpdate = false) {
        const initialTimeCategory = this.data.calculateTimeCategory(...this.xDomain);
        const previousTimeCategory = this.data.currentTimeCategory;
        const min = new Date(chart.scales.x.min);
        const max = new Date(chart.scales.x.max);
        this.data.currentTimeCategory = this.data.calculateTimeCategory(min, max);

        if (
            this.data.currentTimeCategory !== previousTimeCategory ||
            (triggeredByDataUpdate &&
                this.data.currentTimeCategory !== initialTimeCategory)
        ) {
            showLoading(
                this.isLoading$,
                this.loadZoomedInData(
                    chart,
                    min,
                    max,
                    (triggeredByDataUpdate = triggeredByDataUpdate)
                )
            );
        }
    }

    /**
     * load results for the zoomed-in window (using a narrower time category
     * than the zoomed-out chart)
     *
     * @param chart chart object
     * @param min minimum date in window
     * @param max maximum date in window
     * @param triggeredByDataUpdate whether the function was triggered by an update in
     * the underlying data (affects animation only)
     */
    async loadZoomedInData(
        chart,
        min: Date,
        max: Date,
        triggeredByDataUpdate = false
    ) {
        // when zooming, hide data for smooth transition
        chart.update(triggeredByDataUpdate ? 'none' : 'hide');


        const zoomedInResults = await this.data.zoomedInData(min, max);

        zoomedInResults.forEach((data, seriesIndex) => {
            chart.data.datasets[seriesIndex].data =
                this.chartDataFromSeries(data);
        });

        chart.options.scales.x.time.unit = this.currentTimeCategory;
        chart.update('show'); // fade into view
    }

    /**
     * Add a date filter to a query model restricting it to the provided min and max values.
     */
    addQueryDateFilter(query: QueryModel, min: Date, max: Date): QueryModel {
        const queryModelCopy = query.clone();
        // download zoomed in results
        const filter = this.visualizedField.makeSearchFilter();
        filter.set({ min, max });
        queryModelCopy.addFilter(filter);
        return queryModelCopy;
    }

    /** trigger zoom out, update chart data accordingly */
    zoomOut(): void {
        this.chart.resetZoom();
        this.currentTimeCategory = this.data.calculateTimeCategory(...this.xDomain);
        (this.chart.options.scales.x as any).time.unit =
            this.currentTimeCategory;
        this.chart.update();

        this.setChart();
    }

    setTableHeaders() {
        const rightColumnName =
            this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';
        const valueKey = this.currentValueKey;

        if (this.data.rawData$.value.length > 1) {
            this.tableHeaders = [
                {
                    key: 'date',
                    label: 'Date',
                    format: this.formatDate,
                    isSecondaryFactor: true,
                },
                { key: 'queryText', label: 'Query', isMainFactor: true },
                {
                    key: valueKey,
                    label: rightColumnName,
                    format: this.formatValue(this.normalizer),
                    formatDownload: this.formatDownloadValue,
                },
            ];
        } else {
            this.tableHeaders = [
                { key: 'date', label: 'Date', format: this.formatDate },
                {
                    key: 'doc_count',
                    label: 'Document Frequency',
                    format: this.formatValue('raw'),
                    formatDownload: this.formatDownloadValue,
                    isOptional: 'doc_count' !== valueKey,
                },
                {
                    key: 'relative_doc_count',
                    label: 'Document Frequency (%)',
                    format: this.formatValue('percent'),
                    formatDownload: this.formatDownloadValue,
                    isOptional: 'relative_doc_count' !== valueKey,
                },
                {
                    key: 'match_count',
                    label: 'Token Frequency',
                    format: this.formatValue('raw'),
                    formatDownload: this.formatDownloadValue,
                    isOptional: 'match_count' !== valueKey,
                },
                {
                    key: 'matches_by_doc_count',
                    label: 'Relative Frequency (documents)',
                    format: this.formatValue('documents'),
                    formatDownload: this.formatDownloadValue,
                    isOptional: 'matches_by_doc_count' !== valueKey,
                },
                {
                    key: 'matches_by_token_count',
                    label: 'Relative Frequency (terms)',
                    format: this.formatValue('terms'),
                    formatDownload: this.formatDownloadValue,
                    isOptional: 'matches_by_token_count' !== valueKey,
                },
            ];
        }
    }

    /**
     * Format for dates based on the time category.
     * Returns a formatting function.
     */
    // eslint-disable-next-line @typescript-eslint/member-ordering
    get formatDate(): (date) => string {
        let dateFormat: string;
        switch (this.currentTimeCategory) {
            case 'year':
                dateFormat = 'yyyy';
                break;
            case 'month':
                dateFormat = 'MM yyyy';
                break;
            default:
                dateFormat = 'yyyy-MM-dd';
                break;
        }

        return (date: Date) => format(date, dateFormat);
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    get isZoomedIn(): boolean {
        // check whether this.chart is zoomed on x axis

        if (this.chart) {
            const initialBounds = this.chart.getInitialScaleBounds().x;
            const currentBounds = {
                min: this.chart.scales.x.min,
                max: this.chart.scales.x.max,
            };

            return (
                (initialBounds.min && initialBounds.min < currentBounds.min) ||
                (initialBounds.max && initialBounds.max > currentBounds.max)
            );
        }
        return false;
    }
}
