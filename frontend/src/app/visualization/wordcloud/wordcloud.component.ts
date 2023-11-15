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

/** returns a scaling function for words based on their frequency */
export const sizeScale = (min: number, max: number): (frequency: number) => number => {
    const normalize = unitScale(min, max);
    const sizeRange = MAX_FONT_SIZE - MIN_FONT_SIZE;
    return (frequency: number) =>
        MIN_FONT_SIZE + sizeRange * normalize(frequency);
};

/** returns a function that maps values in [min, max] onto [0,1]
 */
const unitScale = (min: number, max: number): (frequency: number) => number => {
    const frequencyRange = (max - min) || 1; // avoid zero-division if all values are the same
    return (frequency: number) => (frequency - min) / frequencyRange;
};

@Component({
    selector: 'ia-wordcloud',
    templateUrl: './wordcloud.component.html',
    styleUrls: ['./wordcloud.component.scss'],
})

export class WordcloudComponent implements OnChanges, OnDestroy {
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

    private chart: Chart;
    private batchSize = 1000;

    constructor(private visualizationService: VisualizationService) { }

    get readyToLoad() {
        return (this.corpus && this.visualizedField && this.queryModel && this.palette);
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

    ngOnDestroy(): void {
        this.chart?.destroy();
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
        if (!this.asTable) {
            const data = this.chartData();
            const options = this.chartOptions();

            if (this.chart) {
                this.chart.data = data;
                this.chart.update();
            } else {
                this.chart = new WordCloudChart('wordcloud', { data, options });
            }
        }
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

    private chartLabels(result: AggregateResult[]): string[] {
        return result.map(item => item.key);
    }

    private chartDataset(result: AggregateResult[]): ChartDataset<'wordCloud'> {
        const frequencies = result.map(item => item.doc_count);
        const scale = sizeScale(_.min(frequencies), _.max(frequencies));
        const sizes = frequencies.map(scale);

        const color = (dataIndex: number) => selectColor(this.palette, dataIndex);

        return {
            label: 'Frequency',
            data: sizes,
            color: (context: ScriptableContext<'wordCloud'>) => color(context.dataIndex),
        };
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
