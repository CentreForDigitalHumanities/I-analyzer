import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartOptions } from 'chart.js';
import { ContextResults, Corpus, FreqTableHeaders, QueryModel } from '../../models';
import { SearchService, WordmodelsService } from '../../services';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as _ from 'lodash';

interface DataPoint {label: string; x: number; y: number}

@Component({
    selector: 'ia-word-context',
    templateUrl: './word-context.component.html',
    styleUrls: ['./word-context.component.scss']
})
export class WordContextComponent implements OnChanges {
    @Input() corpus: Corpus;
    @Input() queryText: string;
    @Input() asTable: boolean;
    @Input() palette: string[];

    // eslint-disable-next-line @angular-eslint/no-output-native
    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

    data: ContextResults;
    timeIntervals: string[];
    currentTimeIndex: number;

    chart: Chart;
    chartOptions: ChartOptions = {
        elements: {
            point: {
                radius: 0
            }
        },
        aspectRatio: 1,
        scales: {
            x: {
                min: -1.2, max: 1.2,
                display: false,
            },
            y: {
                min: -1.2, max: 1.2,
                display: false,
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            datalabels: {
                formatter: (value, _context) => value.label,
            }
        }
    };

    tableHeaders: FreqTableHeaders = [
        {
            key: 'word',
            label: 'Word',
            isSecondaryFactor: true,
        }, {
            key: 'time',
            label: 'Time range',
            isMainFactor: true,
        }, {
            key: 'x',
            label: 'X',
            format: this.formatValue,
        }, {
            key: 'y',
            label: 'Y',
            format: this.formatValue,
        }
    ];

    tableData: { word: string; time: string; x: number; y: number }[];

    constructor(private wordModelsService: WordmodelsService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.queryText || changes.corpus) {
            if (this.queryText && this.corpus) {
                this.showLoading(this.getResults());
            }
        }
    }

    getResults(): Promise<void> {
        return this.wordModelsService.get2dContextOverTime(this.queryText, this.corpus.name).then(result => {
            if (result.success) {
                this.data = result.data;
                this.timeIntervals = result.data.map(item => item.time);
                this.currentTimeIndex = 0;
                this.makeTableData(result.data);
                this.makeGraph(result.data, this.currentTimeIndex);
            } else {
                this.error.emit(result);
            }
        });
    }

    /** execute a process with loading spinner */
    async showLoading(promise) {
        this.isLoading.emit(true);
        await promise;
        this.isLoading.emit(false);
    }


    makeGraph(data: ContextResults, timeIndex: number) {
        const dataset = data[timeIndex];
        this.chart = new Chart('context-chart', {
            type: 'scatter',
            data: {
                datasets: [dataset]
            },
            plugins: [ ChartDataLabels ],
            options: this.chartOptions
        });
    }

    makeTableData(data: ContextResults) {
        this.tableData = _.flatMap(data, timedata =>
            _.map(timedata.data, point => ({
                word: point.label,
                time: timedata.time,
                x: point.x,
                y: point.y
            }))
        );
    }

    formatValue(value: number) {
        return value.toPrecision(4);
    }

    setCurrentTime(event) {
        const value = event.target.value;
        this.currentTimeIndex = value;


        if (this.chart) {
            console.log(this.data[this.currentTimeIndex]);
            this.updateDataset(this.chart.data.datasets[0], this.data[this.currentTimeIndex]);
            this.chart.update();
        }
    }

    updateDataset(dataset, newDataset) {
        // remove points no longer included
        const indexToDelete = () => dataset.data.findIndex((point: DataPoint) =>
            newDataset.data.find(p => p.label === point.label) === undefined
        );

        while (indexToDelete() !== -1) {
            const spliceIndex = indexToDelete();
            dataset.data.splice(spliceIndex, 1);
        }

        // update coordinates of common points
        dataset.data.forEach((point: DataPoint) => {
            const newPoint = newDataset.data.find(p => p.label === point.label);
            point.x = newPoint.x;
            point.y = newPoint.y;
        });

        // push new points
        const newPoints = newDataset.data.filter(point => dataset.data.find((p: DataPoint) => p.label === point.label) === undefined);
        newPoints.forEach(point => dataset.data.push(point));
    }

}
