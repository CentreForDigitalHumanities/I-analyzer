import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Chart, ChartData } from 'chart.js';
import * as _ from 'lodash';
import { selectColor } from '../../visualization/select-color';
import { Corpus, WordSimilarityResults } from '../../models';
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

    comparisonTerms: string[] = ['duitsland'];

    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

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

    constructor(private searchService: SearchService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes.queryText || changes.corpus) && this.comparisonTerms.length) {
            this.getData();
        }
    }

    updateComparisonTerms(terms: string[]) {
        this.comparisonTerms = terms;
        this.getData();
    }

    getData(): void {
        Promise.all(this.comparisonTerms.map(term =>
            this.searchService.getWordSimilarity(this.queryText, term, this.corpus.name)
        )).then(this.onDataLoaded.bind(this));
    }

    onDataLoaded(data: WordSimilarityResults[]): void {
        console.log(data);
        const labels = data[0].time_points;
        const datasets = _.zip(this.comparisonTerms, data).map((series, index) => {
            const [term, result] = series;
            const scores = result.similarity_scores;

            return {
                label: term,
                data: scores,
                borderColor: selectColor(this.palette, index)
            }
        });

        this.chartData = {labels, datasets };
        this.updateChart();
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

}
