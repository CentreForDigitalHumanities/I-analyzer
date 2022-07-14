import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartOptions } from 'chart.js';
import { ContextResults, Corpus, freqTableHeaders, QueryModel } from '../../models';
import { SearchService } from '../../services';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as _ from 'lodash';

@Component({
    selector: 'ia-word-context',
    templateUrl: './word-context.component.html',
    styleUrls: ['./word-context.component.scss']
})
export class WordContextComponent implements OnChanges {
    @Input() corpus: Corpus;
    @Input() queryModel: QueryModel;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

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
                min: -1.1, max: 1.1,
                display: false,
            },
            y: {
                min: -1.1, max: 1.1,
                display: false,
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            datalabels: {
                formatter(value, context): string {
                    return value.label;
                }
            }
        }
    };

    tableHeaders: freqTableHeaders = [
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

    tableData: { word: string, time: string, x: number, y: number }[];

    constructor(private searchService: SearchService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.queryModel || changes.coropus) {
            if (this.queryModel && this.corpus) {
                this.showLoading(this.getResults());
            }
        }
    }

    getResults(): Promise<void> {
        return this.searchService.get2dContextOverTime(this.queryModel.queryText, this.corpus.name).then(result => {
            if (result.success) {
                this.makeTableData(result.data);
                this.makeGraph(result.data);
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

    makeGraph(data: ContextResults) {
        const dataset = data[0];
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

}
