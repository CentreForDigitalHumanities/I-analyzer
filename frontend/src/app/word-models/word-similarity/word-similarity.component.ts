import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Chart, ChartData } from 'chart.js';
import * as _ from 'lodash';
import { selectColor } from '../../visualization/select-color';
import { Corpus, freqTableHeaders, WordSimilarity, WordSimilarityResults } from '../../models';
import { SearchService } from '../../services';

@Component({
    selector: 'ia-word-similarity',
    templateUrl: './word-similarity.component.html',
    styleUrls: ['./word-similarity.component.scss']
})
export class WordSimilarityComponent implements OnChanges {
    @Input() queryText: string;
    @Input() corpus: Corpus;
    @Input() asTable: boolean;
    @Input() palette: string[];

    comparisonTerms: string[] = [];

    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

    results: WordSimilarityResults[];
    timeIntervals: string[];
    chartData: ChartData<'line'>;
    chartOptions =  {
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
                    text: 'Cosine similarity (SVD_PPMI)'
                }
            },
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    boxHeight: 0, // flat boxes so the border is a line
                }
            },
            tooltip: {
                displayColors: true,
                callbacks: {
                    labelColor(tooltipItem: any): any {
                        const color = tooltipItem.dataset.borderColor;
                        return {
                            borderColor: color,
                            backgroundColor: color,
                        };
                    }
                }
            }
        }
    };
    chart: Chart;

    tableHeaders: freqTableHeaders;
    tableData: WordSimilarity[];


    constructor(private searchService: SearchService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes.queryText || changes.corpus) && this.comparisonTerms.length) {
            this.getData();
        } else {
            if (this.results) {
                this.onDataLoaded(this.results);
            }
        }
    }

    updateComparisonTerms(terms: string[] = []) {
        this.comparisonTerms = terms;
        this.setTableHeaders();
        this.getData();
    }

    getData(): void {
        this.showLoading(
            Promise.all(this.comparisonTerms.map(term =>
                this.searchService.getWordSimilarity(this.queryText, term, this.corpus.name)
            ))
        ).then(this.onDataLoaded.bind(this));
    }

    /** execute a process with loading spinner */
    async showLoading(promise): Promise<any> {
        this.isLoading.next(true);
        const result = await promise;
        this.isLoading.next(false);
        return result;
    }


    onDataLoaded(data: WordSimilarityResults[]): void {
        this.results = data;
        this.timeIntervals = data.length ? data[0].time_points : this.timeIntervals;
        const datasets = _.zip(this.comparisonTerms, data).map((series, index) => {
            const [term, result] = series;
            const scores = result.similarity_scores;

            return {
                label: term,
                data: scores,
                borderColor: selectColor(this.palette, index)
            }
        });

        this.chartData = {labels: this.timeIntervals, datasets };
        this.updateChart();
        this.makeTableData();
    }

    setTableHeaders(): void {
        if (this.comparisonTerms.length > 1) {
            this.tableHeaders = [
                { key: 'key', label: 'Term', isMainFactor: true, },
                { key: 'time', label: 'Time interval', isSecondaryFactor: true, },
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
        this.tableData = _.flatMap(_.zip(this.comparisonTerms, this.results), series => {
            const [term, result] = series;
            return _.zip(result.time_points, result.similarity_scores).map(point => {
                const [time, similarity] = point;
                return {
                    key: term,
                    similarity,
                    time,
                }
            })
        });
    }

    updateChart(): void {
        if (!this.chart) {
            this.chart = new Chart('chart', {
                type: 'line',
                data: this.chartData,
                options: this.chartOptions,
            });
        } else {
            this.chart.data = this.chartData;
            this.chart.update();
        }
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

    get tableFileName(): string {
        return `word similarity - ${this.queryText} - ${this.corpus.title}`;
    }

}
