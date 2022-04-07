import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { Chart } from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';

import { AggregateResult, MultipleChoiceFilterData, RangeFilterData,
    visualizationField, HistogramDataPoint, freqTableHeaders, histogramOptions } from '../models/index';
import { BarChartComponent } from './barchart.component';

@Component({
    selector: 'ia-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss']
})
export class HistogramComponent extends BarChartComponent implements OnInit, OnChanges {
    histogram: Chart;

    rawData: AggregateResult[];
    selectedData: HistogramDataPoint[];

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
            if (this.frequencyMeasure === 'tokens' && !this.rawData.find(cat => cat.match_count)) {
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

        this.selectData();

        if (this.visualizedField.visualizationSort) {
            this.selectedData = _.sortBy(this.selectedData, d => d.key);
        } else {
            this.selectedData = _.sortBy(this.selectedData, d => -1 * d.value);
        }

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
            this.rawData = visual.aggregations[this.visualizedField.name];
            const total_documents = _.sum(this.rawData.map(d => d.doc_count));
            this.searchRatioDocuments = this.documentLimit / total_documents;
            this.documentLimitExceeded = this.documentLimit < total_documents;
        });

        await dataPromise;
    }

    async requestTermFrequencyData() {
        const dataPromises = this.rawData.map((cat, index) => {
            const binDocumentLimit = _.min([10000, _.round(this.rawData[index].doc_count * this.searchRatioDocuments)]);
            return new Promise(resolve => {
                this.searchService.aggregateTermFrequencySearch(
                    this.corpus, this.queryModel, this.visualizedField.name, cat.key, binDocumentLimit)
                    .then(result => {
                        const data = result.data;
                        this.rawData[index].match_count = data.match_count;
                        this.rawData[index].total_doc_count = data.doc_count;
                        this.rawData[index].token_count = data.token_count;
                        resolve(true);
                    });
            });
        });

        await Promise.all(dataPromises);

        // signal if total token counts are available
        this.totalTokenCountAvailable = this.rawData.find(cat => cat.token_count) !== undefined;
    }

    selectData(): void {
        if (this.frequencyMeasure === 'tokens') {
            if (this.normalizer === 'raw') {
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, value: cat.match_count }));
            } else if (this.normalizer === 'terms') {
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, value: cat.match_count / cat.token_count }));
            } else if (this.normalizer === 'documents') {
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, value: cat.match_count / cat.total_doc_count }));
            }
        } else {
            if (this.normalizer === 'raw') {
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, value: cat.doc_count }));
            } else {
                const total_doc_count = this.rawData.reduce((s, f) => s + f.doc_count, 0);
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, value: cat.doc_count / total_doc_count }));
            }
        }
    }

    setChart() {
        const labels = this.selectedData.map((item) => item.key);
        const datasets = [
            {
                label: this.queryModel && this.queryModel.queryText ? this.queryModel.queryText : '(no query)',
                data: this.selectedData.map((item) => item.value),
            }
        ];

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
            { key: 'value', label: header, format: this.formatValue, formatDownload: this.formatDownloadValue }
        ];
    }

    get defaultSort(): string {
        if (this.visualizedField && this.visualizedField.visualizationSort) {
            return 'key';
        }
        return 'value';
    }

}
