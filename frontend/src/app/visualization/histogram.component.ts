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
        // doc counts should be requested if query has changed
        const loadDocCounts = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;
        const loadTokenCounts = (this.frequencyMeasure === 'tokens') && loadDocCounts;


        this.prepareChart(loadDocCounts, loadTokenCounts);
    }

    async onOptionChange(options: histogramOptions) {
        this.frequencyMeasure = options.frequencyMeasure;
        this.normalizer = options.normalizer;

        if (this.rawData) {
            if (this.frequencyMeasure === 'tokens' && !this.rawData.find(series => series.data.find(cat => cat.match_count))) {
                this.prepareChart(false, true);
            } else {
                this.prepareChart(false, false);
            }
        }
    }


    async prepareChart(loadDocCounts = false, loadTokenCounts = false) {
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
        let size = 0;
        if (this.visualizedField.searchFilter.defaultData.filterType === 'MultipleChoiceFilter') {
            size = (<MultipleChoiceFilterData>this.visualizedField.searchFilter.defaultData).optionCount;
        } else if (this.visualizedField.searchFilter.defaultData.filterType === 'RangeFilter') {
            size = (<RangeFilterData>this.visualizedField.searchFilter.defaultData).max - (<RangeFilterData>this.visualizedField.searchFilter.defaultData).min;
        }
        const aggregator = {name: this.visualizedField.name, size: size};

        const dataPromise = this.searchService.aggregateSearch(this.corpus, this.queryModel, [aggregator]).then(visual => {
            const data = visual.aggregations[this.visualizedField.name];
            const total_doc_count = _.sumBy(data, item => item.doc_count);
            const searchRatio = this.documentLimit / total_doc_count;

            this.rawData = [{
                data: data,
                total_doc_count: total_doc_count,
                searchRatio: searchRatio,
            }];


        });

        await dataPromise;
        this.documentLimitExceeded = this.rawData.find(series => series.searchRatio < 1) !== undefined;
    }

    async requestTermFrequencyData() {
        const dataPromises = _.flatMap(this.rawData, ((series, seriesIndex) => {
            series.data.map((cat, index) => {
                const binDocumentLimit = _.min([10000, _.round(cat.doc_count * series.searchRatio)]);
                return new Promise(resolve => {
                    this.searchService.aggregateTermFrequencySearch(
                        this.corpus, this.queryModel, this.visualizedField.name, cat.key, binDocumentLimit)
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

    selectData(rawData: HistogramSeriesRaw[]): HistogramSeries[] {
        let getValue: (item: AggregateResult, series: HistogramSeriesRaw) => number;
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
                key: item.key,
                value: getValue(item, series)
            }));
            return {label: series.label, data: data};
        });
    }

    setChart() {
        const all_labels = _.flatMap(this.selectedData, series => series.data.map(item => item.key));
        const labels = all_labels.filter((key, index) => all_labels.indexOf(key) === index);
        // TODO: sort labels by frequency
        const datasets = this.selectedData.map(series => (
            {
                label: this.queryModel && this.queryModel.queryText ? this.queryModel.queryText : '(no query)',
                data: all_labels.map(key => {
                  const item = series.data.find(i => i.key === key);
                  return item ? item.value : 0;
                })
            }
        ));

        if (this.histogram) {
            this.histogram.data.labels = labels;
            this.histogram.data.datasets = datasets;
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

    get tableHeaders(): freqTableHeaders {
        const label = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const header = this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';
        return [
            { key: 'key', label: label },
            { key: 'value', label: header, format: this.formatValue }
        ];
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


}
