import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Format from 'd3-format';
import * as d3Axis from 'd3-axis';
import * as d3Array from 'd3-array';
import * as _ from 'lodash';

import { AggregateResult, Corpus, QueryModel, MultipleChoiceFilterData, RangeFilterData,
    visualizationField, HistogramDataPoint, freqTableHeaders, histogramOptions } from '../models/index';
import { BarChartComponent } from './barchart.component';

@Component({
    selector: 'ia-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss']
})
export class HistogramComponent extends BarChartComponent implements OnInit, OnChanges {
    @ViewChild('histogram', { static: true }) private histogramContainer: ElementRef;
    @Input() corpus: Corpus;
    @Input() queryModel: QueryModel;
    @Input() visualizedField: visualizationField;
    @Input() asTable: boolean;

    @Output() isLoading = new EventEmitter<boolean>();

    rawData: AggregateResult[];
    selectedData: HistogramDataPoint[];

    frequencyMeasure: 'documents'|'tokens' = 'documents';
    normalizer: 'raw' | 'percent' | 'documents'|'terms' = 'raw';

    @Input() documentLimit = 1000; // maximum number of documents to search through for term frequency
    searchRatioDocuments: number; // ratio of documents that can be search without exceeding documentLimit
    documentLimitExceeded = false; // whether some bins have more documents than the limit
    totalTokenCountAvailable: boolean; // whether the data includes token count totals

    private xBarWidth: number;
    private xBarHalf: number;
    private tooltip: any;
    private maxCategories = 30;

    ngOnInit() {
    }

    async ngOnChanges(changes: SimpleChanges) {
        // doc counts should be requested if query has changed
        const loadDocCounts = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;
        const loadTokenCounts = (this.frequencyMeasure === 'tokens') && loadDocCounts;

        if (this.chartElement === undefined) {
            this.chartElement = this.histogramContainer.nativeElement;
            this.calculateCanvas();
        }

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

        if (typeof this.selectedData[0].key === 'number') {
            this.selectedData = _.sortBy(this.selectedData, d => d.key);
        } else {
            this.selectedData = _.sortBy(this.selectedData, d => -1 * d.value);
        }

        this.xDomain = [-.5, this.selectedData.length - .5];
        this.calculateBarWidth(this.selectedData.length);
        this.xScale = d3Scale.scaleLinear().domain(this.xDomain).rangeRound([0, this.width]);
        this.yMax = d3Array.max(this.selectedData.map(d => d.value));
        this.totalCount = _.sumBy(this.selectedData, d => d.value);

        this.setupYScale();
        this.createChart(this.visualizedField.displayName, this.rawData.length);
        this.rescaleY(this.normalizer === 'percent');
        this.setupBrushBehaviour();
        this.drawChartData();
        this.setupTooltip();
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

    calculateBarWidth(noCategories) {
        this.xBarWidth = .95 * this.width / noCategories;
        this.xBarHalf = this.xBarWidth / 2;
    }


    drawChartData() {
        /**
        * bind data to chart, remove or update existing bars, add new bars
        */

        const update = this.chart
            .selectAll('.bar')
            .data(this.selectedData);

        // remove exiting bars
        update.exit().remove();

        this.xAxisClass.tickValues(this.selectedData.map(d => d.key)).tickFormat(d3Format.format('s'));
        // x axis ticks
        this.xAxis.selectAll('text')
            .data(this.selectedData)
            .text(d => d.key)
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-35)');

        // update existing bars
        this.chart.selectAll('.bar').transition()
            .attr('x', (d, i) => this.xScale(i) - this.xBarHalf)
            .attr('y', d => this.yScale(d.value))
            .attr('width', this.xBarWidth)
            .attr('height', d => this.height - this.yScale(d.value));


        if (this.selectedData.length > this.maxCategories) {
            // remove x axis ticks
            this.xAxis.selectAll('.tick').remove();

            // add new bars
            update
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', (d, i) => this.xScale(i) - this.xBarHalf)
                .attr('width', this.xBarWidth)
                .attr('y', this.yScale(0)) // set to zero first for smooth transition
                .attr('height', 0)
                .transition().duration(750)
                .delay((d, i) => i * 10)
                .attr('y', d => this.yScale(d.value))
                .attr('height', d => this.height - this.yScale(d.value))

            // add tooltips
            this.chart.selectAll('.bar')
                .on('mouseover', (event, d) => {
                    const yPos = this.height + 5 * this.margin.top;
                    const xPos = event.offsetX;
                    this.tooltip
                        .text(d.key)
                        .style('left', xPos + 'px')
                        .style('top', yPos + 'px')
                        .style('visibility', 'visible');
                }).on('mouseout', () => this.tooltip.style('visibility', 'hidden'));
        } else {
            // add new bars, without tooltips
            update
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', (d, i) => this.xScale(i) - this.xBarHalf)
                .attr('width', this.xBarWidth)
                .attr('y', this.yScale(0)) // set to zero first for smooth transition
                .attr('height', 0)
                .transition().duration(750)
                .delay((d, i) => i * 10)
                .attr('y', d => this.yScale(d.value))
                .attr('height', d => this.height - this.yScale(d.value))
        }
    }

    setupTooltip() {
        // select the tooltip in the template
        this.tooltip = d3.select('.tooltip');
    }


    zoomIn() {
        const selection = this.selectedData.filter((d, i) => i >= this.xScale.domain()[0] && i <= this.xScale.domain()[1]);
        this.calculateBarWidth(selection.length + 1);

        this.chart.selectAll('.bar')
            .transition().duration(750)
            .attr('x', (d, i) => this.xScale(i) - this.xBarHalf)
            .attr('y', d => this.yScale(d.value))
            .attr('width', this.xBarWidth);

        if (selection.length < this.maxCategories) {
            this.xAxis
                .call(d3Axis.axisBottom(this.xScale).ticks(selection.length))
                .selectAll('.tick text')
                .text((d, i) => selection[i].key)
                .attr('text-anchor', 'end')
                .attr('transform', 'rotate(-35)');
        }
    }

    zoomOut() {
        this.xDomain = [-.5, this.selectedData.length - .5];
        this.calculateBarWidth(this.selectedData.length);
        this.xScale = d3Scale.scaleLinear().domain(this.xDomain).rangeRound([0, this.width]);
        this.xAxis
            .call(d3Axis.axisBottom(this.xScale).ticks(this.selectedData.length));
        this.drawChartData();
    }

    showHistogramDocumentation() {
        this.dialogService.showManualPage('histogram');
    }

    get percentageDocumentsSearched() {
        return _.round(100 * this.searchRatioDocuments);
    }

    get tableHeaders(): freqTableHeaders {
        const label = this.visualizedField.displayName ? this.visualizedField.displayName : this.visualizedField.name;
        const header = this.normalizer === 'raw' ? 'Frequency' : 'Relative frequency';
        let formatValue: (value: number) => string | undefined;
        let formatDownloadValue:  (value: number) => string | undefined;
        if (this.normalizer === 'percent') {
            formatValue = (value: number) =>  `${_.round(100 * value, 1)}%`;
            formatDownloadValue = (value: number) => `${_.round(100 * value, 1)}`;
        }
        return [
            { key: 'key', label: label },
            { key: 'value', label: header, format: formatValue, formatDownload: formatDownloadValue }
        ];
    }

    get defaultSort(): string {
        if (this.visualizedField && this.visualizedField.visualizationSort) {
            return 'key';
        }
        return 'value';
    }
}
