import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Chart, ChartData, ChartOptions, Filler } from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { selectColor } from '../../visualization/select-color';
import { FreqTableHeaders, WordSimilarity } from '../../models';

/**
 * Child component of the related words and compare similarity graphs.
 * Handles making the visualisations: a graph with a line and bar layout
 */
@Component({
    selector: 'ia-similarity-chart',
    templateUrl: './similarity-chart.component.html',
    styleUrls: ['./similarity-chart.component.scss']
})
export class SimilarityChartComponent implements OnInit, OnChanges, OnDestroy {
    @Input() chartTitle: Object;
    @Input() timeIntervals: string[];
    @Input() totalData: WordSimilarity[];
    @Input() zoomedInData: WordSimilarity[][];
    @Input() asTable: boolean;
    @Input() palette: string[];
    @Input() tableFileName = 'similarty';

    terms: string[] = [];

    chartData: ChartData;
    chartOptions: ChartOptions = {};
    chart: Chart;

    tableHeaders: FreqTableHeaders;
    tableData: WordSimilarity[];

    graphStyle = new BehaviorSubject<'line'|'bar'>('line');

    currentTimeIndex = undefined;

    constructor() { }

    ngOnInit(): void {
        this.graphStyle.subscribe(this.updateChart.bind(this));
    }

    ngOnDestroy(): void {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.totalData || (changes.zoomedInData && this.graphStyle.value === 'bar') || changes.palette) {
            this.updateChart(this.graphStyle.value);
            this.updateTable();
        }
    }

    zoomTimeInterval(timeIndex: number) {
        if (timeIndex !== this.currentTimeIndex) {
            this.currentTimeIndex = timeIndex;
            this.updateChart(this.graphStyle.value);
        }
    }

    updateTable(): void {
        this.setTerms();
        this.setTableHeaders();
        this.makeTableData();
    }

    setTerms(): void {
        if (this.totalData) {
            this.terms = _.uniq(this.totalData.map(item => item.key));
        }

    }

    setTableHeaders(): void {
        if (this.terms.length > 1) {
            this.tableHeaders = [
                { key: 'key', label: 'Term', isSecondaryFactor: true, },
                { key: 'time', label: 'Time interval', isMainFactor: true, },
                { key: 'similarity', label: 'Similarity', format: this.formatValue, formatDownload: this.formatDownloadValue }
            ];
        } else {
            this.tableHeaders = [
                { key: 'time', label: 'Time interval',},
                { key: 'similarity', label: 'Similarity', format: this.formatValue, formatDownload: this.formatDownloadValue }
            ];
        }
    }

    makeTableData(): void {
        this.tableData = this.totalData;
    }

    formatValue(value: number): string {
        if (value) {
            return `${value.toPrecision(3)}`;
        }
    }

    formatDownloadValue(value: number): string {
        if (value) {
            return `${value}`;
        }
    }

    /** convert array of word similarities to a chartData object */
    makeChartData(data: WordSimilarity[], style: 'line'|'bar'): ChartData {
        const allSeries = _.groupBy(data, point => point.key);
        const datasets = _.values(allSeries).map((series, datasetIndex) => {
            const label = series[0].key;
            const similarities = series.map(point => point.similarity);
            const colour = selectColor(this.palette, datasetIndex);
            return {
                label,
                data: similarities,
                borderColor: colour,
                backgroundColor: colour,
            };
        });

        const labels = (style === 'line') ? this.timeIntervals : [this.timeIntervals[this.currentTimeIndex]];

        return {
            labels,
            datasets,
        };
    }

    filterTimeInterval(data: WordSimilarity[], interval: string): WordSimilarity[] {
        return data.filter(point => point.time === interval);
    }

    updateChart(style: 'line'|'bar'): void {
        let data: WordSimilarity[];
        if (style !== 'bar') {
            this.currentTimeIndex = undefined;
            data = this.totalData;
        } else {
            if (this.currentTimeIndex === undefined) {
                this.currentTimeIndex = 0;
            }
            const time = this.timeIntervals[this.currentTimeIndex];
            if (this.zoomedInData === undefined) {
                data = this.filterTimeInterval(this.totalData, time);
            } else {
                data = this.zoomedInData[this.currentTimeIndex];
            }
        }

        this.chartData = this.makeChartData(data, style);
        this.makeChart(this.chartData, style);

    }

    makeChart(data: ChartData, style: 'line'|'bar'): void {
        const options: ChartOptions = {
            devicePixelRatio: 4,
            elements: {
                line: {
                    tension: 0, // disables bezier curves
                },
                point: {
                    radius: 0, // hide points
                },
            },
            scales: {
                x: {},
                y: {
                    title: {
                        display: true,
                        text: 'Cosine similarity'
                    }
                },
            },
            plugins: {
                ...this.chartOptions,
                legend: {
                    display: true,
                    labels: {}
                },
                tooltip: {
                    displayColors: true,
                    callbacks: {
                        labelColor: (tooltipItem: any): any => {
                            const color = tooltipItem.dataset.borderColor;
                            return {
                                borderColor: color,
                                backgroundColor: color,
                            };
                        },
                    }
                },
                zoom: {
                    zoom: {
                        mode: 'x',
                        drag: { enabled: false },
                        pinch: { enabled: false },
                        wheel: { enabled: false },
                    }
                }
            }
        };

        if (style === 'line') {
            options.plugins.legend.labels = {
                boxHeight: 0, // flat boxes so the border is a line
            };
            options.elements.point.radius = 4;
            options.plugins.legend.labels.usePointStyle = true;
            options.plugins.zoom.zoom.drag = {
                enabled: true,
                threshold: 0,
            };
        }

        if (style === 'bar') {
            // hide grid lines as we only have one data point on x axis
            data.datasets.forEach(dataset => dataset.type = 'bar');
            options.scales.x = {
                grid: {
                    display: false
                }
            };
        }

        if (this.chart) {
            this.chart.data = data;
            this.chart.options = options;
            this.chart.update();
        } else {
            this.chart = new Chart('chart', {
                type: 'line',
                data,
                options,
                plugins: [Filler, Zoom]
            });
            this.chart.canvas.ondblclick = (event) => this.chart.resetZoom();
        }
    }
}
