import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
import { Corpus, freqTableHeaders, QueryModel, visualizationField } from '../models';
import { SearchService } from '../services';

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
    @Output() isLoading = new EventEmitter<boolean>();

    tableHeaders: freqTableHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'ngram', label: 'N-gram' },
        { key: 'freq', label: 'Frequency' }
    ];
    tableData: { date: string, ngram: string, freq: number }[];

    public chartData: any;
    public colorPalette = ['#88CCEE', '#44AA99', '#117733', '#332288', '#DDCC77', '#999933', '#CC6677', '#882255', '#AA4499', '#DDDDDD'];
    public chartOptions = {
        elements: {
            line: {
                tension: 0, // disables bezier curves
            }
        },
        scales: {
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Weighed frequency'
                }
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Date',
                }
            }],
        },
        tooltips: {
            intersect: false,
            callbacks: {
                labelColor(tooltipItem, chart): any {
                    const dataset = chart.data.datasets[tooltipItem.datasetIndex];
                    const color = dataset.borderColor;
                    return {
                        borderColor: 'rba(0,0,0,0)',
                        backgroundColor: color
                    };
                },
                label(tooltipItem, data): string {
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    const label = dataset.label;
                    const value: any = dataset.data[tooltipItem.index];
                    if (value) { // skip 0 values
                        return `${label}: ${Math.round((value) * 10000) / 10000}`;
                    }
                  },
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

        this.searchService.getNgram(this.queryModel, this.corpus.name, this.visualizedField.name,
            size, position, freqCompensation, analysis, maxSize)
            .then(results => {
                const result = results['graphData'];
                this.setTableData(result);
                result.datasets.forEach((data, index) => {
                    data.borderColor = this.colorPalette[index];
                    data.backgroundColor = 'rgba(0,0,0,0)';
                    data.pointRadius = 0;
                    data.pointHoverRadius = 0;
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
