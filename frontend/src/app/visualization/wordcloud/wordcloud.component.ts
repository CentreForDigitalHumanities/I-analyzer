import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';

import * as cloud from 'd3-cloud';
import * as d3 from 'd3';

import { AggregateResult, visualizationField, QueryModel, Corpus, freqTableHeaders } from '../../models/index';
import { DialogService, SearchService, ApiService } from '../../services/index';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
    selector: 'ia-wordcloud',
    templateUrl: './wordcloud.component.html',
    styleUrls: ['./wordcloud.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class WordcloudComponent implements OnChanges, OnInit, OnDestroy {
    @ViewChild('wordcloud', { static: true }) private chartContainer: ElementRef;
    @Input() visualizedField: visualizationField;
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() resultsCount: number;
    @Input() asTable: boolean;

    @Output() error = new EventEmitter();
    @Output() isLoading = new BehaviorSubject<boolean>(false);

    public significantText: AggregateResult[];
    public disableLoadMore: boolean = false;
    private tasksToCancel: string[] = [];

    private batchSize = 1000;

    private width = 600;
    private height = 400;
    private scaleFontSize = d3.scaleLinear();

    private chartElement: any;
    private svg: any;

    tableHeaders = [
        { key: 'key', label: 'Term' },
        { key: 'doc_count', label: 'Frequency' }
    ];

    constructor(private dialogService: DialogService, private searchService: SearchService, private apiService: ApiService) { }

    ngOnInit() {
        if (this.resultsCount > 0) {
            this.disableLoadMore = this.resultsCount < this.batchSize;
        }
    }

    ngOnDestroy() {
        this.apiService.abortTasks({'task_ids': this.tasksToCancel});
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.visualizedField || changes.queryModel || changes.corpus) {
            if (this.corpus && this.visualizedField && this.queryModel) {
                this.loadData(this.batchSize);
            }
        }
    }

    loadData(size: number = null) {
        this.isLoading.next(true);
        this.searchService.getWordcloudData(this.visualizedField.name, this.queryModel, this.corpus.name, size).then(result => {
            this.significantText = result[this.visualizedField.name];
            this.onDataLoaded();
        })
        .catch(error => {
            this.error.emit(error);
        });
    }

    loadMoreData() {
        this.isLoading.next(true);
        const queryModel = this.queryModel;
        if (queryModel) {
            this.searchService.getWordcloudTasks(this.visualizedField.name, queryModel, this.corpus.name).then(result => {
                this.tasksToCancel = result['taskIds'];
                    const childTask = result['taskIds'][0];
                    this.apiService.getTaskOutcome({'task_id': childTask}).then( outcome => {
                        if (outcome['success'] === true) {
                            this.significantText = outcome['results'] as AggregateResult[];
                            this.onDataLoaded();
                        } else {
                            this.error.emit(outcome);
                        }
                    });
            });
        }
    }

    onDataLoaded() {
        this.isLoading.next(false);
        this.chartElement = this.chartContainer.nativeElement;
        d3.selectAll('svg').remove();
        const inputRange = d3.extent(this.significantText.map(d => d.doc_count)) as number[];
        const outputRange = [20, 80];
        this.scaleFontSize.domain(inputRange).range(outputRange);
        this.drawWordCloud(this.significantText);

    }

    showWordcloudDocumentation() {
        this.dialogService.showManualPage('wordcloud');
    }


    drawWordCloud(significantText: AggregateResult[]) {
        this.svg = d3.select(this.chartElement)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        const chart = this.svg
            .append("g")
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")")
            .selectAll("text");

        const fill = d3.scaleOrdinal(d3.schemeCategory10);

        const layout = cloud()
            .size([this.width, this.height])
            .words(significantText)
            .padding(5)
            .rotate(function () { return ~~(Math.random() * 2) * 90; })
            .font("Impact")
            .fontSize(d => this.scaleFontSize((d.doc_count)))
            .on("end", function (words) {
                // as d3 overwrites the "this" scope, this function is kept inline (cannot access the dom element otherwise)
                chart
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function (d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .style("fill", function (d, i) { return fill(i); })
                    .attr("text-anchor", "middle")
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(d => d.key);
            });

        layout.start();
    }
}
