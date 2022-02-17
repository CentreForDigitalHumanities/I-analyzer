import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { Chart } from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';

import { AggregateResult, MultipleChoiceFilterData, RangeFilterData,
    visualizationField, HistogramDataPoint, freqTableHeaders, histogramOptions,
    HistogramSeriesRaw, HistogramSeries } from '../models/index';
import { BarChartComponent } from './barchart.component';

@Component({
    selector: 'ia-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss']
})
export class HistogramComponent extends BarChartComponent implements OnInit, OnChanges {
    histogram: Chart;

    rawData: HistogramSeriesRaw[];
    selectedData: HistogramSeries[];

    ngOnInit() {
    }

    async ngOnChanges(changes: SimpleChanges) {
        // new doc counts should be requested if query has changed
        const refreshData = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;

        if (refreshData) {
            this.rawData = [this.newSeries(this.queryModel.queryText)];
            this.prepareChart();
        }
    }

    onOptionChange(options: histogramOptions) {
        this.frequencyMeasure = options.frequencyMeasure;
        this.normalizer = options.normalizer;

        if (this.rawData && this.histogram) {
            this.prepareChart();
        }
    }

    addSeries(queryText: string) {
        this.rawData.push(this.newSeries(queryText));
        this.prepareChart();
    }

    async prepareChart() {
        this.isLoading.emit(true);

        await this.requestDocumentData();
        if (this.frequencyMeasure === 'tokens') { await this.requestTermFrequencyData(); }

        this.selectedData = this.selectData(this.rawData);

        if (!this.selectedData.length) {
            this.error.emit({message: 'No results'});
        }

        this.setTableHeaders();
        this.setTableData();

        this.setChart();
        this.isLoading.emit(false);
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
                const queryModelCopy = _.cloneDeep(this.queryModel);
                queryModelCopy.queryText = series.queryText;
                return this.searchService.aggregateSearch(this.corpus, queryModelCopy, [aggregator]).then(visual => {
                    const data = visual.aggregations[this.visualizedField.name];
                    const total_doc_count = _.sumBy(data, item => item.doc_count);
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
                return series.data.map((cat, index) => {
                    const binDocumentLimit = _.min([10000, _.round(cat.doc_count * series.searchRatio)]);
                    return new Promise(resolve => {
                        this.searchService.aggregateTermFrequencySearch(
                            this.corpus, queryModelCopy, this.visualizedField.name, cat.key, binDocumentLimit)
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

    selectData(rawData: HistogramSeriesRaw[]): HistogramSeries[] {
        let getValue: (item: AggregateResult, series: HistogramSeriesRaw) => number;

        const valueFuncs = {
            tokens: {
                raw: (item, series) => item.match_count ,
                terms: (item, series) => item.match_count / item.token_count,
                documents: (item, series) => item.match_count / item.total_doc_count
            },
            documents: {
                raw: (item, series) => item.doc_count,
                percent: (item, series) => item.doc_count / series.total_doc_count
            }
        };

        getValue = valueFuncs[this.frequencyMeasure][this.normalizer];

        return rawData.map(series => {
            const data = series.data.map(item => ({
                key: item.key,
                value: getValue(item, series) || 0,
            }));
            return {label: series.queryText, data: data};
        });
    }

    setChart() {
        const all_labels = _.flatMap(this.selectedData, series => series.data.map(item => item.key));
        const labels = all_labels.filter((key, index) => all_labels.indexOf(key) === index);
        // TODO: sort labels by frequency
        const datasets = this.selectedData.map((series, seriesIndex) => (
            {
                label: series.label ? series.label : '(no query)',
                data: all_labels.map(key => {
                  const item = series.data.find(i => i.key === key);
                  return item ? item.value : 0;
                }),
                backgroundColor: this.colorPalette[seriesIndex],
                hoverBackgroundColor: this.colorPalette[seriesIndex],
            }
        ));

        if (this.histogram) {
            this.histogram.data.labels = labels;
            this.histogram.data.datasets = datasets;
            this.histogram.options.plugins.legend.display = datasets.length > 1;
            this.histogram.update();
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
        this.histogram = new Chart('histogram',
            {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets,
                },
                plugins: [ Zoom ],
                options: options
            });

        this.histogram.canvas.ondblclick = (event) => {
            (this.histogram as any).resetZoom();
        };
    }

    setTableHeaders() {
        const label = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const header = this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';
        this.tableHeaders = [
            { key: 'key', label: label },
            { key: 'value', label: header, format: this.formatValue }
        ];
    }

    setTableData() {
        if (this.selectedData && this.selectedData.length) {
            this.tableData = this.selectedData[0].data;
        }
    }

    get defaultSort(): string {
        if (this.visualizedField && this.visualizedField.visualizationSort) {
            return 'key';
        }
        return 'value';
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

    get percentageDocumentsSearched() {
        return _.round(100 *  _.max(this.rawData.map(series => series.searchRatio)));
    }

    get queries(): string[] {
        if (this.rawData) {
            return this.rawData.map(series => series.queryText);
        }
    }
}
