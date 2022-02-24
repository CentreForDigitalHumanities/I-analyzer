import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Chart, ChartOptions } from 'chart.js';
import * as _ from 'lodash';
import { Corpus, freqTableHeaders, QueryModel, visualizationField } from '../models';
import { SearchService } from '../services';
import { selectColor } from './select-color';

@Component({
    selector: 'ia-ngram',
    templateUrl: './ngram.component.html',
    styleUrls: ['./ngram.component.scss']
})
export class NgramComponent implements OnInit, OnChanges {
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() visualizedField: visualizationField;
    @Input() asTable: boolean;
    @Input() palette: string[];
    @Output() isLoading = new EventEmitter<boolean>();

    tableHeaders: freqTableHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'ngram', label: 'N-gram' },
        { key: 'freq', label: 'Frequency' }
    ];
    tableData: { date: string, ngram: string, freq: number }[];

    public chartData: {
        labels: string[],
        datasets: {
            label: string,
            data: number[],
            borderColor?: string,
        }[]
    };
    public chartOptions: ChartOptions = {
        elements: {
            line: {
                tension: 0, // disables bezier curves
                fill: false,
            },
            point: {
                radius: 0,
                hoverRadius: 0,
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
                labels: {
                    boxHeight: 0, // flat boxes to the border is a line
                }
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
                            return `${label}: ${Math.round((value) * 10000) / 10000}`;
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


    constructor(private searchService: SearchService) { }

    ngOnInit(): void { }

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

            this.loadGraph();
        } else if (changes.palette && this.chartData) {
            this.chartData = {
                labels: this.chartData.labels,
                datasets: this.chartData.datasets.map((dataset, index) => (
                    {
                        label: dataset.label,
                        data: dataset.data,
                        borderColor: selectColor(this.palette, index)
                    }
                ))
            };
        }
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
                this.chartOptions.scales['yAxis'] = {
                    title: {
                        display: true,
                        text: value ? 'Weighed frequency' : 'Frequency'
                    }
                };
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

        this.searchService.getNgram(this.queryModel, this.corpus.name, this.visualizedField.name,
            size, position, freqCompensation, analysis, maxSize)
            .then(results => {
                const result = results['graphData'];
                this.setTableData(result);
                result.datasets.forEach((data, index) => {
                    data.borderColor = selectColor(this.palette, index);
                });
                this.chartData = result;
                this.isLoading.emit(false);
        }).catch(error => {
            this.chartData = undefined;
            this.isLoading.emit(false);
        });
    }

    setTableData(results: { datasets: { label: string, data: number[] }[], labels: string[] }) {
        this.tableData = _.flatMap(
            results.labels.map((date, index) => {
                return results.datasets.map(dataset => ({
                    date: date,
                    ngram: dataset.label,
                    freq: dataset.data[index],
                }));
            })
        );

    }


}
