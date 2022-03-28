import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { Chart } from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';

import { AggregateResult, MultipleChoiceFilterData, RangeFilterData,
    visualizationField, freqTableHeaders, histogramOptions,
    HistogramSeries } from '../models/index';
import { BarChartComponent } from './barchart.component';

@Component({
    selector: 'ia-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss']
})
export class HistogramComponent extends BarChartComponent<AggregateResult> implements OnInit, OnChanges {

    async ngOnChanges(changes: SimpleChanges) {
        // new doc counts should be requested if query has changed
        if (this.changesRequireRefresh(changes)) {
            this.rawData = [this.newSeries(this.queryModel.queryText)];
            this.setQueries();
            this.prepareChart();
        }
    }

    async requestDocumentData() {
        let size = 0;
        if (this.visualizedField.searchFilter.defaultData.filterType === 'MultipleChoiceFilter') {
            size = (<MultipleChoiceFilterData>this.visualizedField.searchFilter.defaultData).optionCount;
        } else if (this.visualizedField.searchFilter.defaultData.filterType === 'RangeFilter') {
            size = (<RangeFilterData>this.visualizedField.searchFilter.defaultData).max - (<RangeFilterData>this.visualizedField.searchFilter.defaultData).min;
        }
        const aggregator = {name: this.visualizedField.name, size: size};

        const dataPromises = this.rawData.map((series, seriesIndex) => {
            if (!series.data.length) { // retrieve data if it was not already loaded
                this.requestSeriesDocumentData(series, aggregator).then(result =>
                    this.rawData[seriesIndex] = result);
            }
        });

        await Promise.all(dataPromises);
        this.checkDocumentLimitExceeded();
    }

    requestSeriesDocumentData(series: HistogramSeries,  aggregator): Promise<HistogramSeries> {
        const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
        return this.searchService.aggregateSearch(
            this.corpus, queryModelCopy, [aggregator]).then(result =>
                    this.docCountResultIntoSeries(result, series)
                );
    }

    async requestTermFrequencyData() {
        const dataPromises = _.flatMap(this.rawData, ((series, seriesIndex) => {
            if (series.queryText && series.data[0].match_count === undefined) { // retrieve data if it was not already loaded
                return series.data.map((cat, index) =>
                    this.requestCategoryTermFrequencyData(cat, index, series)
                );
            }
        }));

        await Promise.all(dataPromises);

        // signal if total token counts are available
        this.totalTokenCountAvailable = this.rawData.find(series => series.data.find(cat => cat.token_count)) !== undefined;
    }

    requestCategoryTermFrequencyData(cat: AggregateResult, catIndex: number, series: HistogramSeries) {
        const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
        const binDocumentLimit = this.documentLimitForCategory(cat, series);
        return this.searchService.aggregateTermFrequencySearch(
                this.corpus, queryModelCopy, this.visualizedField.name, cat.key, binDocumentLimit)
                .then(result => this.addTermFrequencyToCategory(result, cat));
    }

    setChart() {
        const valueKey = this.currentValueKey;
        const labels = this.uniqueLabels();
        const datasets = this.rawData.map((series, seriesIndex) => (
            {
                label: series.queryText ? series.queryText : '(no query)',
                data: labels.map(key => {
                  const item = series.data.find(i => i.key === key);
                  return item ? item[valueKey] : 0;
                }),
                backgroundColor: this.colorPalette[seriesIndex],
                hoverBackgroundColor: this.colorPalette[seriesIndex],
            }
        ));

        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets = datasets;
            this.chart.options.plugins.legend.display = datasets.length > 1;
            this.chart.update();
        } else {
            this.initChart(labels, datasets);
        }

    }

    initChart(labels, datasets) {
        const xAxisLabel = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const options = this.basicChartOptions;
        options.scales.xAxis.type = 'category';
        (options.scales.xAxis as any).title.text = xAxisLabel;
        options.plugins.tooltip = {
            callbacks: {
                label: (tooltipItem) => {
                    const value = (tooltipItem.raw as number);
                    return this.formatValue(value);
                }
            }
        };
        options.plugins.legend = {display: datasets.length > 1};
        this.chart = new Chart('histogram',
            {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets,
                },
                plugins: [ Zoom ],
                options: options
            });

        this.chart.canvas.ondblclick = (event) => {
            (this.chart as any).resetZoom();
        };
    }

    setTableHeaders() {
        const label = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const rightColumnName = this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';

        const valueKey = this.currentValueKey;

        if (this.rawData.length > 1) {
            this.tableHeaders = [
                { key: 'key', label: label },
                { key: 'queryText', label: 'Query' },
                { key: valueKey, label: rightColumnName, format: this.formatValue }
            ];
        } else {
            this.tableHeaders = [
                { key: 'key', label: label },
                { key: valueKey, label: rightColumnName, format: this.formatValue }
            ];
        }
    }

    uniqueLabels(): string[] {
        if (this.rawData) {
            const all_labels = _.flatMap(this.rawData, series => series.data.map(item => item.key));
            const labels = all_labels.filter((key, index) => all_labels.indexOf(key) === index);
            let sorted_labels: string[];
            if (this.visualizedField.visualizationSort === 'key') {
                sorted_labels = labels.sort();
            } else {
                const valueKey = this.currentValueKey;
                sorted_labels = _.sortBy(labels, label =>
                    _.sumBy(this.rawData, series => {
                        const item = series.data.find(i => i.key === label);
                        return -1 * (item ? item[valueKey] : 0);
                    })
                );
            }
            return sorted_labels;
        }
    }

    get defaultSort(): string {
        if (this.visualizedField && this.visualizedField.visualizationSort) {
            return 'key';
        }
        return this.currentValueKey;
    }

    get formatValue(): (value: number) => string {
        if (this.normalizer === 'percent') {
            return (value: number) => {
                return `${_.round(100 * value, 1)}%`;
            };
        } else {
            return (value: number) => value.toString();
        }
    }

}
