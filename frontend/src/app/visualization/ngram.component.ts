import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { ChartOptions } from 'chart.js';
import * as _ from 'lodash';
import { Corpus, freqTableHeaders, QueryModel, visualizationField } from '../models';
import { ApiService, SearchService } from '../services';

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
    @Output() isLoading = new EventEmitter<boolean>();
    @Output() error = new EventEmitter<({ message: string })>();

    tableHeaders: freqTableHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'ngram', label: 'N-gram' },
        { key: 'freq', label: 'Frequency' }
    ];
    tableData: { date: string, ngram: string, freq: number }[];

    public chartData: any;
    public colorPalette = ['#88CCEE', '#44AA99', '#117733', '#332288', '#DDCC77', '#999933', '#CC6677', '#882255', '#AA4499', '#DDDDDD'];
    public chartOptions: ChartOptions = {
        elements: {
            line: {
                tension: 0, // disables bezier curves
            }
        },
        scales: {
            yAxis: {
                title: {
                    display: true,
                    text: 'Weighed frequency'
                }
            },
            xAxis: {
                title: {
                    display: true,
                    text: 'Date',
                }
            },
        },
        plugins: {
            legend: {
                display: true,
            },
            tooltip: {
                intersect: false,
                displayColors: true,
                callbacks: {
                    labelColor(tooltipItem: any): any {
                        const color = tooltipItem.dataset.borderColor;
                        return {
                            borderColor: color,
                            backgroundColor: color,
                            borderWidth: 0,
                        };
                    },
                    label(tooltipItem: any): string {
                        const label = tooltipItem.dataset.label;
                        const value = tooltipItem.raw;
                        if (value) { // skip 0 values
                            return `${label}: ${_.round(value, 4)}`;
                        }
                      },
                }
            }
        }
    };

    // options
    sizeOptions = [{label: 'bigrams', value: 2}, {label: 'trigrams', value: 3}];
    size: number|undefined = undefined;
    positionsOptions = [{label: 'any', value: [0,1]}, {label: 'first', value: [0]}, {label: 'second', value: [1]}];
    positions: number[]|undefined = undefined;
    freqCompensationOptions = [{label: 'Yes', value: true}, {label: 'No', value: false}];
    freqCompensation: boolean|undefined = undefined;
    analysisOptions: {label: string, value: string}[];
    analysis: string|undefined;
    maxDocumentsOptions = [50, 100, 200, 500].map(n => ({label: `${n}`, value: n}));
    maxDocuments: number|undefined;

    tasksToCancel: string[];

    constructor(private searchService: SearchService, private apiService: ApiService) { }

    ngOnInit(): void { }

    ngOnDestroy(): void {
        this.apiService.abortTasks({'task_ids': this.tasksToCancel});
    }

    ngOnChanges(): void {
        if (this.visualizedField.multiFields) {
            this.analysisOptions = [{label: 'None', value: 'none'}]
                .concat(this.visualizedField.multiFields.map(subfield => {
                    const displayStrings = { clean: 'Remove stopwords', stemmed: 'Stem and remove stopwords'};
                    return { value: subfield, label: displayStrings[subfield]};
                }));
        } else {
            this.analysisOptions = undefined;
        }

        this.loadGraph();
    }

    onOptionChange(control: 'size'|'position'|'freq_compensation'|'analysis'|'max_size',
                        selection: {value: any, label: string}): void {
        const value = selection.value;
        switch (control) {
            case 'size': {
                this.size = value;
                // set positions dropdown options and reset its value
                const positions = Array.from(Array(this.size).keys());
                this.positionsOptions =  [ { value: positions, label: 'any' } ]
                    .concat(positions.map(position => {
                        return { value : [position], label: ['first', 'second', 'third'][position] }
                    }));
                this.positions = this.positionsOptions[0].value;
            }
            break;
            case 'position': {
                this.positions = value;
            }
            break;
            case 'freq_compensation': {
                this.freqCompensation = value;
                this.chartOptions.scales.yAxes[0].scaleLabel.labelString = value ? 'Weighed frequency' : 'Frequency';
            }
            break;
            case 'analysis': {
                this.analysis = value;
            }
            break;
            case 'max_size': {
                this.maxDocuments = value;
            }
        }

        this.loadGraph();
    }

    loadGraph() {
        this.isLoading.emit(true);
        const size = this.size ? this.size : this.sizeOptions[0].value;
        const position = this.positions ? this.positions : Array.from(Array(size).keys());
        const freqCompensation = this.freqCompensation !== undefined ?
        this.freqCompensation : this.freqCompensationOptions[0].value;
        const analysis = this.analysis ? this.analysis : 'none';
        const maxSize = this.maxDocuments ? this.maxDocuments : 100;

        this.searchService.getNgramTasks(this.queryModel, this.corpus.name, this.visualizedField.name,
            size, position, freqCompensation, analysis, maxSize)
            .then(result => {
                this.tasksToCancel = result.task_ids;
                const childTask = result.task_ids[0];
                this.apiService.getTaskOutcome({'task_id': childTask}).then(outcome => {
                    if (outcome.success === true) {
                        this.onDataLoaded(outcome.results);
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

    onDataLoaded(result) {
        this.setTableData(result);
        const chartData = {
            labels: result.time_points,
            datasets: result.words
        };

        chartData.datasets.forEach((data, index) => {
            data.borderColor = this.colorPalette[index];
            data.backgroundColor = 'rgba(0,0,0,0)';
            data.pointRadius = 0;
            data.pointHoverRadius = 0;
        });
        this.chartData = chartData;
        this.isLoading.emit(false);

    }

    setTableData(results: { words: { label: string, data: number[] }[], time_points: string[] }) {
        this.tableData = _.flatMap(
            results.time_points.map((date, index) => {
                return results.words.map(dataset => ({
                    date: date,
                    ngram: dataset.label,
                    freq: dataset.data[index],
                }));
            })
        );

    }


}
