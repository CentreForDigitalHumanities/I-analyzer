import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ChartOptions, Chart, ChartData } from 'chart.js';
import * as _ from 'lodash';
import { Corpus, freqTableHeaders, QueryModel, visualizationField, NgramResults, NgramParameters } from '../../models';
import { selectColor } from '../select-color';
import { ApiService, SearchService } from '../../services';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-ngram',
    templateUrl: './ngram.component.html',
    styleUrls: ['./ngram.component.scss']
})
export class NgramComponent implements OnInit, OnChanges, OnDestroy {
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() visualizedField: visualizationField;
    @Input() asTable: boolean;
    @Input() palette: string[];
    @Output() isLoading = new EventEmitter<boolean>();
    @Output() error = new EventEmitter<({ message: string })>();

    @ViewChild('chart-container') chartContainer: ElementRef;

    tableHeaders: freqTableHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'ngram', label: 'N-gram' },
        { key: 'freq', label: 'Frequency' }
    ];
    tableData: { date: string, ngram: string, freq: number }[];

    chartData: any;
    chartOptions: any;
    chart: Chart;

    fixLineGraphHeights = true;
    maxDataPoint: number;

    timeLabels: string[] = [];
    ngrams: string[] = [];

    // options
    sizeOptions = [{label: 'bigrams', value: 2}, {label: 'trigrams', value: 3}];
    positionsOptions = [{label: 'any', value: [0, 1]}, {label: 'first', value: [0]}, {label: 'second', value: [1]}];
    freqCompensationOptions = [{label: 'Yes', value: true}, {label: 'No', value: false}];
    analysisOptions: {label: string, value: string}[];
    maxDocumentsOptions = [50, 100, 200, 500].map(n => ({label: `${n}`, value: n}));
    numberOfNgramsOptions = [10, 20, 50, 100].map(n => ({label: `${n}`, value: n}));

    tasksToCancel: string[];

    resultsCache: {[parameters: string]: any} = {};
    currentParameters: NgramParameters;
    lastParameters: NgramParameters;
    parametersChanged = false;

    faCheck = faCheck;
    faTimes = faTimes;

    constructor(private searchService: SearchService, private apiService: ApiService) {
    }

    ngOnInit(): void { }

    ngOnDestroy(): void {
        this.apiService.abortTasks({'task_ids': this.tasksToCancel});
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel || changes.corpus || changes.visualizedField) {
            if (this.visualizedField.multiFields) {
                this.analysisOptions = [{label: 'None', value: 'none'}]
                    .concat(this.visualizedField.multiFields.map(subfield => {
                        const displayStrings = { clean: 'Remove stopwords', stemmed: 'Stem and remove stopwords'};
                        return { value: subfield, label: displayStrings[subfield]};
                    }));
            } else {
                this.analysisOptions = undefined;
            }

            this.setDefaultParameters();
            this.loadGraph();
        } else if (changes.palette && this.chartData) {
            this.updateChartColors();
        }
    }

    setDefaultParameters() {
        this.currentParameters = {
            size: this.sizeOptions[0].value,
            positions: this.positionsOptions[0].value,
            freqCompensation: this.freqCompensationOptions[0].value,
            analysis: 'none',
            maxDocuments: 100,
            numberOfNgrams: 10,
        };
    }

    loadGraph() {
        this.isLoading.emit(true);

        const changeAspectRatio = this.chart && this.lastParameters.numberOfNgrams !== this.currentParameters.numberOfNgrams;

        this.lastParameters = _.clone(this.currentParameters);
        const cachedResult = this.getCachedResult(this.currentParameters);

        if (cachedResult) {
            this.onDataLoaded(cachedResult, changeAspectRatio);
        } else {
            this.searchService.getNgramTasks(this.queryModel, this.corpus.name, this.visualizedField.name,
                this.currentParameters)
                .then(result => {
                    this.tasksToCancel = result.task_ids;
                    const childTask = result.task_ids[0];
                    this.apiService.getTaskOutcome({'task_id': childTask}).then(outcome => {
                        if (outcome.success === true) {
                            this.cacheResult(outcome.results, this.currentParameters);
                            this.onDataLoaded(outcome.results, changeAspectRatio);
                        } else {
                            this.error.emit({message: outcome.message});
                        }
                    });
            }).catch(error => {
                this.chartData = undefined;
                this.error.emit(error);
                this.isLoading.emit(false);
            });
        }
    }

    onDataLoaded(result, changeAspectRatio = false) {
        this.setmaxDataPoint(result);

        this.tableData = this.makeTableData(result);
        this.chartData = this.makeChartdata(result);
        this.chartOptions = this.makeChartOptions(this.chartData);

        if (this.chart) {
            if (changeAspectRatio) {
                this.resetChartHeight();
            }
            this.chart.data = this.chartData;
            this.chart.options = this.chartOptions;
            this.chart.update();
        } else {
            this.chart = this.makeChart();
        }

        this.isLoading.emit(false);
    }

    resetChartHeight() {
        // updating aspect ratio has no effect if canvas height is set
        // set to null before updating
        this.chart.canvas.style.height = null;
        this.chart.canvas.height = null;
    }

    makeTableData(result: NgramResults): any[] {
        return _.flatMap(
            result.time_points.map((date, index) => {
                return result.words.map(dataset => ({
                    date: date,
                    ngram: dataset.label,
                    freq: dataset.data[index],
                }));
            })
        );
    }

    makeChartdata(result: NgramResults): any {
        this.timeLabels = result.time_points;
        this.ngrams = result.words.map(item => item.label);

        const datasets: any[] = _.reverse( // reverse drawing order so datasets are drawn OVER the one above them
            result.words.map((item, index) => {
                const points = this.getDataPoints(item.data, index);
                return {
                    type: 'line',
                    xAxisID: 'x',
                    label: item.label,
                    data: points,
                    borderColor: selectColor(this.palette, index),
                    fill: {
                        target: {value: index},
                        above: this.getFillColor.bind(this),
                    },
                };
            })
        );

        const totals = result.words.map(item => _.sum(item.data));
        const totalsData = totals.map((value, index) => ({
            x: value,
            y: index,
            ngram: this.ngrams[index],
        }));
        const colors = totals.map((value, index) => selectColor(this.palette, index))

        const totalsDataset = {
            type: 'bar',
            xAxisID: 'xTotal',
            indexAxis: 'y',
            label: 'total frequency',
            backgroundColor: colors,
            hoverBackgroundColor: colors,
            data: totalsData,
        };

        datasets.push(totalsDataset);

        return {
            labels: this.timeLabels,
            datasets,
        };
    }

    cacheResult(result: any, params: NgramParameters): void {
        const key = this.parametersKey(params);
        this.resultsCache[key] = result;
    }

    getCachedResult(params: NgramParameters): any {
        const key = this.parametersKey(params);
        if (_.has(this.resultsCache, key)) {
            return this.resultsCache[key];
        }
    }

    parametersKey(params: NgramParameters): string {
        return `${params.size}/${params.positions}/${params.freqCompensation}/${params.analysis}/${params.maxDocuments}/${params.numberOfNgrams}`;
    }

    updateChartColors() {
        this.chartData.datasets.forEach((dataset, index) => {
            const inverseIndex = this.chartData.datasets.length - (index + 1);
            dataset.borderColor = selectColor(this.palette, inverseIndex);
        });
        this.chart.update();
    }

    getFillColor(context) {
        const borderColor = context.dataset.borderColor as string;

        if (borderColor.startsWith('#') && borderColor.length === 7) { // hex color
            const red = parseInt(borderColor.slice(1, 3), 16);
            const green = parseInt(borderColor.slice(3, 5), 16);
            const blue = parseInt(borderColor.slice(5, 7), 16);

            return `rgba(${red}, ${green}, ${blue}, 0.5)`;
        }
    }

    makeChartOptions(data: ChartData): ChartOptions {
        const totalsData = _.last(data.datasets).data;
        const totals = totalsData.map((item: any) => item.x);
        const maxTotal = _.max(totals);

        const numberOfRows = data.datasets.length - 1;

        return {
            aspectRatio: 24 / (4 + numberOfRows),
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 0,
                }
            },
            scales: {
                xTotal: {
                    type: 'linear',
                    title: {
                        text: 'Total Frequency',
                        display: true,
                    },
                    ticks: {
                        display: false,
                    },
                    max: maxTotal * 1.05,
                    position: 'top',
                    stack: '1',
                    stackWeight: 1.5,
                    display: true,
                },
                x: {
                    type: 'category',
                    title: {
                        text: 'Frequency over time',
                        display: true,
                    },
                    position: 'top',
                    stack: '1',
                    stackWeight: 8.5,
                },
                y: {
                    reverse: true,
                    title: {
                        text: 'Ngram'
                    },
                    ticks: {
                        stepSize: 1,
                        callback: (val, index) => {
                            return this.ngrams[val];
                        }
                    }
                },
            },
            plugins: {
                legend: { display: false },
                filler: {
                    propagate: true,
                },
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            const tooltipItem = tooltipItems[0];
                            if (tooltipItem.dataset.xAxisID === 'xTotal') {
                                return 'Total frequency';
                            } else {
                                return tooltipItem.label;
                            }
                        },
                        label: (tooltipItem) => {
                            let ngram: string;
                            let value: number;
                            if (tooltipItem.dataset.xAxisID === 'xTotal') {
                                ngram = (tooltipItem.raw as any).ngram;
                                value = (tooltipItem.raw as any).x;
                            } else {
                                ngram = tooltipItem.dataset.label;
                                value = (tooltipItem.raw as any).value;
                            }
                            return `${ngram}: ${value}`;
                        }
                    }
                }
            }
        };
    }

    getDataPoints(data: number[], ngramIndex: number) {
        const yValues = this.getYValues(data, ngramIndex);

        return _.zip(data, yValues).map(([value, y], x) => ({
            y,
            value,
            x,
        }));
    }

    getYValues(data: number[], ngramIndex: number): number[] {
        const scaled = this.scaleValues(data);
        return scaled.map(value => ngramIndex - value);
    }

    scaleValues(data: number[]): number[] {
        const max = this.fixLineGraphHeights ? _.max(data) : this.maxDataPoint;
        return data.map(point => 1.1 * point / max);
    }

    makeChart() {
        return new Chart('chart', {
            type: 'line',
            data: this.chartData,
            options: this.chartOptions,
        });
    }

    setmaxDataPoint(result: NgramResults) {
        this.maxDataPoint = _.max(
            _.map(result.words,
                item => _.max(item.data)
            )
        );
    }

    setFixLineHeights(event) {
        this.fixLineGraphHeights = event.target.checked;
        if (this.chart) {
            const result = this.getCachedResult(this.lastParameters);
            this.chartData = this.makeChartdata(result);
            this.chart.data = this.chartData;
            this.chart.update();
        }
    }

    setPositionsOptions(size) {
        // set positions dropdown options and reset its value
        const positions = Array.from(Array(size).keys());
        this.positionsOptions =  [ { value: positions, label: 'any' } ]
        .concat(positions.map(position => {
            return { value : [position], label: ['first', 'second', 'third'][position] };
        }));
        this.currentParameters.positions = this.positionsOptions[0].value;
    }


    onParameterChange(parameter: string, value: any) {
        this.currentParameters[parameter] = value;

        if (parameter === 'size' && value) { this.setPositionsOptions(value); }

        this.parametersChanged = true;
    }

    cancelChanges() {
        this.setPositionsOptions(this.lastParameters.size);
        this.currentParameters = this.lastParameters;
        this.parametersChanged = false;
    }

    confirmChanges() {
        this.parametersChanged = false;
        this.loadGraph();
    }

    get currentSizeOption() {
        if (this.currentParameters) {
            return this.sizeOptions.find(item => item.value === this.currentParameters.size);
        }
    }

    get currentPositionsOption() {
        if (this.currentParameters) {
            return this.positionsOptions.find(item => _.isEqual(item.value, this.currentParameters.positions));
        }
    }

    get currentFreqCompensationOption() {
        if (this.currentParameters) {
            return this.freqCompensationOptions.find(item => item.value === this.currentParameters.freqCompensation);
        }
    }

    get currentAnalysisOption() {
        if (this.currentParameters) {
            return this.analysisOptions.find(item => item.value === this.currentParameters.analysis);
        }
    }

    get currentMaxDocumentsOption() {
        if (this.currentParameters) {
            return this.maxDocumentsOptions.find(item => item.value === this.currentParameters.maxDocuments);
        }
    }

    get currentNumberOfNgramsOption() {
        if (this.currentParameters) {
            return this.numberOfNgramsOptions.find(item => item.value === this.currentParameters.numberOfNgrams);
        }
    }
}
