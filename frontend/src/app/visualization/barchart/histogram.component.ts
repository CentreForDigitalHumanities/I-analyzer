import { Component, OnChanges, OnInit, SimpleChanges, } from '@angular/core';
import * as _ from 'lodash';

import { AggregateResult, MultipleChoiceFilterData, RangeFilterData,
    HistogramSeries } from '../../models/index';
import { BarChartComponent } from './barchart.component';
import { selectColor } from '../select-color';

function formatXAxisLabel(value): string {
    const label = this.getLabelForValue(value); // from chartJS api
    const max_length = 30;
    if (label.length > max_length) {
        return `${label.slice(0, max_length)}...`;
    }
    return label;
}


@Component({
    selector: 'ia-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss']
})
export class HistogramComponent extends BarChartComponent<AggregateResult> implements OnInit, OnChanges {

    fullTableToggle: boolean = false;
    disableToggleButton: boolean = false;

    /** specify aggregator object based on visualised field;
     * used in document requests.
    */
    getAggregator() {
        let size = 0;
        if (!this.visualizedField.searchFilter) {
            return {name: this.visualizedField.name, size: 100};
        }

        const defaultData = this.visualizedField.searchFilter.defaultData;
        if (defaultData.filterType === 'MultipleChoiceFilter') {
            size = (<MultipleChoiceFilterData>defaultData).optionCount;
        } else if (defaultData.filterType === 'RangeFilter') {
            size = (<RangeFilterData>defaultData).max - (<RangeFilterData>defaultData).min;
        }
        return {name: this.visualizedField.name, size: size};
    }

    requestSeriesDocumentData(series: HistogramSeries): Promise<HistogramSeries> {
        const aggregator = this.getAggregator();
        const queryModelCopy = this.selectSearchFields(this.setQueryText(this.queryModel, series.queryText));

        return this.searchService.aggregateSearch(
            this.corpus, queryModelCopy, [aggregator]).then(result =>
                    this.docCountResultIntoSeries(result, series)
                );
    }

    requestCategoryTermFrequencyData(cat: AggregateResult, catIndex: number, series: HistogramSeries) {
        if (cat.doc_count) {
            const queryModelCopy = this.selectSearchFields(this.setQueryText(this.queryModel, series.queryText));
            const binDocumentLimit = this.documentLimitForCategory(cat, series);
            return this.searchService.aggregateTermFrequencySearch(
                    this.corpus, queryModelCopy, this.visualizedField.name, cat.key, binDocumentLimit)
                    .then(result => this.addTermFrequencyToCategory(result, cat));
        } else {
            return new Promise<void>(resolve => resolve());
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
                backgroundColor: selectColor(this.palette, seriesIndex),
                hoverBackgroundColor: selectColor(this.palette, seriesIndex),
            }
        ));
    }

    chartOptions(datasets: any[]) {
        const xAxisLabel = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const options = this.basicChartOptions;
        options.plugins.title.text = this.chartTitle();
        options.scales.xAxis.type = 'category';
        (options.scales.xAxis as any).title.text = xAxisLabel;
        options.scales.xAxis.ticks = { callback: formatXAxisLabel };
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

    toggleFullTable() {
        this.fullTableToggle = !this.fullTableToggle;
        this.setTableHeaders();
    }

    setTableHeaders() {
        const label = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const rightColumnName = this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';
        const valueKey = this.currentValueKey;

        if (this.rawData.length > 1) {
            this.disableToggleButton = true;  // if there are several queries, disable the toggle button
            this.tableHeaders = [
                { key: 'key', label: label, isSecondaryFactor: true, },
                { key: 'queryText', label: 'Query', isMainFactor: true, },
                { key: valueKey, label: rightColumnName, format: this.formatValue,  formatDownload: this.formatDownloadValue  }
            ];
        } else if (this.fullTableToggle) {
            this.disableToggleButton = false;
            this.tableHeaders = [
                { key: 'key', label: label },
                { key: 'match_count', label: 'Raw Frequency', format: this.formatDownloadValue, formatDownload: this.formatDownloadValue },
                { key: 'matches_by_doc_count', label: 'Relative Frequency (documents)', format: this.formatValue, formatDownload: this.formatDownloadValue },
                { key: 'matches_by_token_count', label: 'Relative Frequency (terms)', format: this.formatValue, formatDownload: this.formatDownloadValue },
            ];
        } else {
            this.disableToggleButton = false;
            this.tableHeaders = [
                { key: 'key', label: label},
                { key: valueKey, label: rightColumnName, format: this.formatValue,  formatDownload: this.formatDownloadValue  }
            ];
        }
    }

    /** On what property should the data be sorted? */
    get defaultSort(): string {
        if (this.visualizedField && this.visualizedField.visualizationSort) {
            return 'key';
        }
        return this.currentValueKey;
    }
}
