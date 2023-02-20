import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges,
    ViewChild, ViewEncapsulation } from '@angular/core';

import * as cloud from 'd3-cloud';
import * as d3 from 'd3';

import { AggregateResult, CorpusField, QueryModel, Corpus, FreqTableHeaders } from '../../models/index';
import { DialogService, SearchService, ApiService } from '../../services/index';
import { BehaviorSubject, Observable } from 'rxjs';
import { VisualizationService } from '../../services/visualization.service';

@Component({
    selector: 'ia-wordcloud',
    templateUrl: './wordcloud.component.html',
    styleUrls: ['./wordcloud.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class WordcloudComponent implements OnChanges, OnInit, OnDestroy {
    @ViewChild('wordcloud', { static: true }) private chartContainer: ElementRef;
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

    private width = 600;
    private height = 400;
    private scaleFontSize = d3.scaleLinear();

    private chartElement: any;
    private svg: any;

    constructor(private visualizationService: VisualizationService, private apiService: ApiService) { }

    ngOnInit() {
        if (this.resultsCount > 0) {
            this.disableLoadMore = this.resultsCount < this.batchSize;
        }
    }

    ngOnDestroy() {
        this.apiService.abortTasks({task_ids: this.tasksToCancel});
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((this.corpus && this.visualizedField && this.queryModel && this.batchSize && this.palette)  &&
            (changes.corpus || changes.visualizedField || changes.queryModel || changes.batchSize)) {
            this.loadData(this.batchSize);
        } else {
            this.onDataLoaded();
        }
    }

    loadData(size: number = null) {
        this.isLoading.next(true);
        this.visualizationService.getWordcloudData(this.visualizedField.name, this.queryModel, this.corpus.name, size).then(result => {
            this.significantText = result;
            this.onDataLoaded();
        })
        .catch(this.emitError.bind(this));
    }

    loadMoreData() {
        this.isLoading.next(true);
        const queryModel = this.queryModel;
        if (queryModel) {
            this.visualizationService.getWordcloudTasks(this.visualizedField.name, queryModel, this.corpus.name).then(response => {
                this.tasksToCancel = response;
                this.apiService.pollTasks<AggregateResult[]>(response).then( outcome => {
                    const result = outcome[0];
                    this.significantText = result;
                    this.onDataLoaded();
                });
            }).catch(this.emitError.bind(this));
        }
    }

    emitError(error: {message: string}) {
        this.error.emit(error.message);
    }

    onDataLoaded() {
        this.isLoading.next(false);
        this.chartElement = this.chartContainer.nativeElement;
        d3.select('svg.wordcloud').remove();
        const inputRange = d3.extent(this.significantText.map(d => d.doc_count)) as number[];
        const outputRange = [20, 80];
        this.scaleFontSize.domain(inputRange).range(outputRange);
        this.drawWordCloud(this.significantText);

    }

    drawWordCloud(significantText: AggregateResult[]) {
        this.svg = d3.select(this.chartElement)
            .append('svg')
            .classed('wordcloud', true)
            .attr('width', this.width)
            .attr('height', this.height);
        const chart = this.svg
            .append('g')
            .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')
            .selectAll('text');

        const fill = d3.scaleOrdinal(this.palette);

        const layout = cloud()
            .size([this.width, this.height])
            .words(significantText)
            .padding(5)
            .rotate(() => ~~(Math.random() * 2) * 90)
            .font('Impact')
            .fontSize(d => this.scaleFontSize((d.doc_count)))
            .on('end', (words) => {
                // as d3 overwrites the "this" scope, this function is kept inline (cannot access the dom element otherwise)
                chart
                    .data(words)
                    .enter().append('text')
                    .style('font-size', (d) => d.size + 'px')
                    .style('font-family', 'Impact')
                    .style('fill', (d, i) => fill(i))
                    .attr('text-anchor', 'middle')
                    .attr('transform', (d) => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')')
                    .text(d => d.key);
            });

        layout.start();
    }
}
