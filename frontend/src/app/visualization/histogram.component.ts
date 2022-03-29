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

    /** specify aggregator object based on visualised field */
    getAggregator() {
        let size = 0;
        if (this.visualizedField.searchFilter.defaultData.filterType === 'MultipleChoiceFilter') {
            size = (<MultipleChoiceFilterData>this.visualizedField.searchFilter.defaultData).optionCount;
        } else if (this.visualizedField.searchFilter.defaultData.filterType === 'RangeFilter') {
            size = (<RangeFilterData>this.visualizedField.searchFilter.defaultData).max - (<RangeFilterData>this.visualizedField.searchFilter.defaultData).min;
        }
        return {name: this.visualizedField.name, size: size};
    }

    requestSeriesDocumentData(series: HistogramSeries): Promise<HistogramSeries> {
        const aggregator = this.getAggregator();
        const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
        return this.searchService.aggregateSearch(
            this.corpus, queryModelCopy, [aggregator]).then(result =>
                    this.docCountResultIntoSeries(result, series)
                );
    }

    requestCategoryTermFrequencyData(cat: AggregateResult, catIndex: number, series: HistogramSeries) {
        const queryModelCopy = this.setQueryText(this.queryModel, series.queryText);
        const binDocumentLimit = this.documentLimitForCategory(cat, series);
        return this.searchService.aggregateTermFrequencySearch(
                this.corpus, queryModelCopy, this.visualizedField.name, cat.key, binDocumentLimit)
                .then(result => this.addTermFrequencyToCategory(result, cat));
    }

    setChart() {
        if (this.chart) {
            this.updateChartData();
        } else {
            this.initChart();
        }
    }

    getDatasets() {
        const labels = this.getLabels();
        const valueKey = this.currentValueKey;
        return this.rawData.map((series, seriesIndex) => (
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
    }

    chartOptions(datasets: any[]) {
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
        return options;
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

    getLabels(): string[] {
        // make an array of all unique labels and sort

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

}
