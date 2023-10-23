import {
    Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';


import { AggregateResult, CorpusField, QueryModel, Corpus, FreqTableHeaders } from '../../models/index';
import { ApiService } from '../../services/index';
import { BehaviorSubject } from 'rxjs';
import { VisualizationService } from '../../services/visualization.service';
import { showLoading } from '../../utils/utils';
import { Chart, ChartData, ChartDataset, ChartOptions, ScriptableContext, TooltipItem } from 'chart.js';
import { WordCloudChart } from 'chartjs-chart-wordcloud';
import * as _ from 'lodash';
import { selectColor } from '../../utils/select-color';

// maximum font size in px
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 48;

@Component({
    selector: 'ia-wordcloud',
    templateUrl: './wordcloud.component.html',
    styleUrls: ['./wordcloud.component.scss'],
})

export class WordcloudComponent implements OnChanges, OnInit, OnDestroy {
    @Input() visualizedField: CorpusField;
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() resultsCount: number;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Output() error = new EventEmitter();
    @Output() isLoading = new BehaviorSubject<boolean>(false);

    tableHeaders: FreqTableHeaders = [
        { key: 'key', label: 'Term' },
        { key: 'doc_count', label: 'Frequency' }
    ];

    public significantText: AggregateResult[];
    public disableLoadMore = false;
    private tasksToCancel: string[] = [];

    private batchSize = 1000;

    private chart: Chart;

    constructor(private visualizationService: VisualizationService, private apiService: ApiService) { }

    get readyToLoad() {
        return (this.corpus && this.visualizedField && this.queryModel && this.palette);
    }

    ngOnInit() {
        if (this.resultsCount > 0) {
            this.disableLoadMore = this.resultsCount < this.batchSize;
        }
    }

    ngOnDestroy() {
        this.apiService.abortTasks({task_ids: this.tasksToCancel});
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.readyToLoad  &&
            (changes.corpus || changes.visualizedField || changes.queryModel)) {
            if (changes.queryModel) {
                this.queryModel.update.subscribe(this.loadData.bind(this));
            }
            this.loadData();
        } else {
            this.makeChart();
        }
    }

    loadData() {
        showLoading(
            this.isLoading,
            this.visualizationService.getWordcloudData(
                this.visualizedField.name, this.queryModel, this.corpus, this.batchSize
            ).then(this.onDataLoaded.bind(this)).catch(this.emitError.bind(this))
        );
    }

    emitError(error: {message: string}) {
        this.error.emit(error.message);
    }

    onDataLoaded(result: AggregateResult[]) {
        this.significantText = result;
        this.makeChart();
    }

    makeChart() {
        const data = this.chartData();
        const options = this.chartOptions();

        this.chart = new WordCloudChart('wordcloud', { data, options });
    }

    private chartLabels(result: AggregateResult[]): string[] {
        return result.map(item => item.key);
    }

    private chartData(): ChartData<'wordCloud'> {
        if (this.significantText) {
            const labels = this.chartLabels(this.significantText);
            const datasets = [this.chartDataset(this.significantText)];
            return {
                labels, datasets
            };
        }
        return { labels: [], datasets: [] };
    }

    private chartDataset(result: AggregateResult[]): ChartDataset<'wordCloud'> {
        const frequencies = result.map(item => item.doc_count);
        const scale = this.sizeScale(_.min(frequencies), _.max(frequencies));
        const sizes = frequencies.map(scale);

        const color = (dataIndex: number) => selectColor(this.palette, dataIndex);

        return {
            label: 'Frequency',
            data: sizes,
            color: (context: ScriptableContext<'wordCloud'>) => color(context.dataIndex),
        };
    }

    /** returns a scaling functions for words based on their frequency */
    private sizeScale(min: number, max: number): (frequency: number) => number {
        const normalize = this.normalize(min, max);
        const sizeRange = MAX_FONT_SIZE - MIN_FONT_SIZE;
        return (frequency: number) =>
            MIN_FONT_SIZE + sizeRange * normalize(frequency);
    }

    /** returns a normaliser function based on a min and max value
     *
     * values in [min, max] are mapped onto [0,1]
     */
    private normalize(min: number, max: number): (frequency: number) => number {
        const frequencyRange = (max - min) || 1; // avoid zero-division if all values are the same
        return (frequency: number) => (frequency - min) / frequencyRange;

    }

    private chartOptions(): ChartOptions<'wordCloud'> {
        return {
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        label: (item: TooltipItem<'wordCloud'>) =>
                            this.significantText[item.dataIndex].doc_count.toString()
                    }
                }
            }
        };
    }
}
