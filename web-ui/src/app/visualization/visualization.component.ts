import { ElementRef, Input, Component, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import { SelectItem, SelectItemGroup } from 'primeng/api';

import { Corpus, AggregateResults, QueryModel } from '../models/index';
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

    public visualization: object;
    public visualizationType: string;
    public visualizedField: string;
    public termFrequencyFields: string[];
    public groupedVisualizations: SelectItemGroup[];

    public wordCloud: boolean = false;
    public barChart: boolean = false;
    public freqTable: boolean = false;

    public chartElement: any;

    public aggResults: {
        key: any,
        doc_count: number
    }[];

    constructor(private searchService: SearchService) {
        this.groupedVisualizations = [
            {
                label: 'Histograms',
                items: [
                    { label: 'Date', value: { type: 'barchart', field: 'date' } },
                    { label: 'Category', value: { type: 'barchart', field: 'category' } },
                ]
            },
            {
                label: 'Other',
                items: [
                    { label: 'Word Cloud', value: { type: 'wordcloud', field: 'none' } }
                ]
            }
        ]

        this.visualizationType = "barchart";
        this.freqTable = true;
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


    }

    setVisualizationType(event) {
        if (event.value.type == 'barchart') {
            this.setVisualizedField(event.value.field.toLowerCase())
            this.freqTable = true;
        }
        else {
            this.freqTable = false;
        }
        this.visualizationType = event.value.type;
    }

    toggleTable() {
        if (this.visualizationType == 'barchart') {
            this.visualizationType = 'freqtable';
        }
        else {
            this.visualizationType = 'barchart';
        }
    }

    showTable() {
        this.visualizationType = 'freqtable';

    }

    showChart() {
        this.visualizationType = 'barchart';

    }

}
