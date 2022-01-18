import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Format from 'd3-format';
import * as d3Axis from 'd3-axis';
import * as d3Array from 'd3-array';
import * as _ from 'lodash';

import { AggregateResult, Corpus, QueryModel, MultipleChoiceFilterData, RangeFilterData, visualizationField } from '../models/index';
import { BarChartComponent } from './barchart.component';

@Component({
    selector: 'ia-term-frequency',
    templateUrl: './term-frequency.component.html',
    styleUrls: ['./term-frequency.component.scss']
})
export class TermFrequencyComponent extends BarChartComponent implements OnInit, OnChanges {
    @ViewChild('termfrequency', { static: true }) private termFreqContainer: ElementRef;
    @Input() corpus: Corpus;
    @Input() queryModel: QueryModel;
    @Input() visualizedField: visualizationField;
    @Input() frequencyMeasure: 'documents'|'tokens' = 'documents';
    @Input() normalizer: 'raw' | 'percent' | 'documents'|'terms' = 'raw';

    @Output() isLoading = new EventEmitter<boolean>();
    @Output() totalTokenCountAvailable = new EventEmitter<boolean>();

    aggregator: { name: string, size: number };
    rawData: AggregateResult[];
    selectedData: { key: string, doc_count: number }[];

    private xBarWidth: number;
    private xBarHalf: number;
    private tooltip: any;
    private maxCategories = 30;

    ngOnInit() {
    }

    async ngOnChanges(changes: SimpleChanges) {
        // doc counts should be requested if query has changed
        const loadDocCounts = (changes.corpus || changes.queryModel || changes.visualizedField) !== undefined;

        // token counts should be requested if they are requested and not already present for this query
        const loadTokenCounts = (this.frequencyMeasure === 'tokens') && (loadDocCounts  || !(this.rawData.find(cat => cat.match_count)));

        if (this.chartElement === undefined) {
            this.chartElement = this.termFreqContainer.nativeElement;
            this.calculateCanvas();
        }

        this.isLoading.emit(true);

        await this.prepareTermFrequency(loadDocCounts, loadTokenCounts);
        this.setupYScale();
        this.createChart(this.visualizedField.displayName, this.rawData.length);
        this.rescaleY(this.normalizer === 'percent');
        this.setupBrushBehaviour();
        this.drawChartData();
        this.setupTooltip();
        this.isLoading.emit(false);
    }

    async prepareTermFrequency(loadDocCounts = false, loadTokenCounts = false) {
        if (loadDocCounts) { await this.requestDocumentData(); }
        if (loadTokenCounts) { await this.requestTermFrequencyData(); }

        if (typeof this.rawData[0].key === 'number') {
            this.rawData = _.sortBy(this.rawData, d => d.key);
        }

        this.selectData();

        this.xDomain = [-.5, this.selectedData.length - .5];
        this.calculateBarWidth(this.selectedData.length);
        this.xScale = d3Scale.scaleLinear().domain(this.xDomain).rangeRound([0, this.width]);
        this.yMax = d3Array.max(this.selectedData.map(d => d.doc_count));
        this.totalCount = _.sumBy(this.selectedData, d => d.doc_count);
    }

    async requestDocumentData() {
        let size = 0;
        if (this.visualizedField.searchFilter.defaultData.filterType === 'MultipleChoiceFilter') {
            size = (<MultipleChoiceFilterData>this.visualizedField.searchFilter.defaultData).optionCount;
        } else if (this.visualizedField.searchFilter.defaultData.filterType === 'RangeFilter') {
            size = (<RangeFilterData>this.visualizedField.searchFilter.defaultData).max - (<RangeFilterData>this.visualizedField.searchFilter.defaultData).min;
        }
        this.aggregator = {name: this.visualizedField.name, size: size};

        const dataPromise = this.searchService.aggregateSearch(this.corpus, this.queryModel, [this.aggregator]).then(visual => {
            this.rawData = visual.aggregations[this.visualizedField.name];
        });

        await dataPromise;
    }

    async requestTermFrequencyData() {
        const dataPromise = new Promise(resolve => {
            this.rawData.forEach((cat, index) => {
                if (cat.doc_count > 0) {
                    this.searchService.aggregateTermFrequencySearch(
                        this.corpus, this.queryModel, this.visualizedField.name, cat.key)
                        .then(result => {
                            const data = result.data;
                            this.rawData[index].match_count = data.match_count;
                            this.rawData[index].total_doc_count = data.doc_count;
                            this.rawData[index].token_count = data.token_count;

                            if (index === this.rawData.length - 1) {
                                resolve(true);
                            }
                        });
                }
            });
        });

        await dataPromise;

        // signal if total token counts are available
        this.totalTokenCountAvailable.emit(this.rawData.find(cat => cat.token_count) !== undefined);
    }

    selectData(): void {
        if (this.frequencyMeasure === 'tokens') {
            if (this.normalizer === 'raw') {
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, doc_count: cat.match_count }));
            } else if (this.normalizer === 'terms') {
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, doc_count: 100 * cat.match_count / cat.token_count }));
            } else if (this.normalizer === 'documents') {
                this.selectedData = this.rawData.map(cat =>
                    ({ key: cat.key, doc_count: cat.match_count / cat.total_doc_count }));
            }
        } else {
            this.selectedData = this.rawData.map(cat =>
                ({ key: cat.key, doc_count: cat.doc_count }));
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
            .attr('y', d => this.yScale(d.doc_count))
            .attr('width', this.xBarWidth)
            .attr('height', d => this.height - this.yScale(d.doc_count));


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
                .attr('y', d => this.yScale(d.doc_count))
                .attr('height', d => this.height - this.yScale(d.doc_count))

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
                .attr('y', d => this.yScale(d.doc_count))
                .attr('height', d => this.height - this.yScale(d.doc_count))
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
            .attr('y', d => this.yScale(d.doc_count))
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

}
