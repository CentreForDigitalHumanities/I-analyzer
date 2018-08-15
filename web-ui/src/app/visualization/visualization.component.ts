import { ElementRef, Input, Component, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import { Corpus, AggregateResults, FoundDocument, QueryModel } from '../models/index';
import { SearchService } from '../services/index';


@Component({
    selector: 'visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnChanges {
    @ViewChild('chart') private chartContainer: ElementRef;

    @Input() public queryModel: QueryModel;
    @Input() public corpus: Corpus;
    @Input() public ids: string[];

    public visualizedField: string;
    public termFrequencyFields: string[];
    public significantText: any[];
    public wordCloud: boolean = false;
    public barChart: boolean = false;

    public chartElement: any;
    public aggResults: AggregateResult[];

    constructor(private searchService: SearchService) {
    }

    ngOnInit() {
        this.chartElement = this.chartContainer.nativeElement;
    }

    ngOnChanges(changes: SimpleChanges) {
        this.termFrequencyFields = this.corpus && this.corpus.fields
            ? this.corpus.fields.filter(field => field.termFrequency).map(field => field.name)
            : [];

        if (this.termFrequencyFields.length) {
            this.setVisualizedField(this.termFrequencyFields[0]);
        }
    }

    setVisualizedField(visualizedField: string) {
        this.searchService.searchForVisualization(this.corpus, this.queryModel, visualizedField).then(visual => {
            this.visualizedField = visualizedField;
            this.aggResults = visual.aggregations;
        });
        this.wordCloud = false;
        this.barChart = true;
    }

    showWordcloud() {
        let fields = ["content"];
        this.searchService.searchForWordcloud(this.corpus, this.ids, fields).then(results => {
            this.significantText = Object.keys(results).map( key => {
                let newObj: AggregateResult = {
                    key: key,
                    doc_count: results[key].term_freq
                };
                return newObj;
            });
        });
/*        this.searchService.searchForVisualization(this.corpus, this.queryModel, "wordcloud").then(results => {
            this.significantText = results.aggregations;
        });*/
        this.wordCloud = true;
        this.barChart = false;
    }

}

type AggregateResult = {
    key: any,
    doc_count: number
}
