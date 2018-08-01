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
    public SelectedVisualization: string;
    public visualizedField: string;
    public groupedVisualizations: SelectItemGroup[];

    public visualizedFields: string[];
    public wordCloud: boolean = false;
    public barChart: boolean = false;
    public freqTable: boolean = false;

    public chartElement: any;

    public aggResults: {
        key: {};
        doc_count: number;
        key_as_string?: string;
    }[];

    private visualizationType: string;

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

        this.SelectedVisualization = "barchart";
        this.freqTable = true;
    }

    ngOnInit() {
        this.chartElement = this.chartContainer.nativeElement;
    }

    ngOnChanges(changes: SimpleChanges) {
        this.visualizedFields = this.corpus && this.corpus.fields
            ? this.corpus.fields.filter(field => field.visualizationType != undefined).map(field => field.name)
            : [];

        if (this.visualizedFields.length) {
            this.setVisualizedField(this.visualizedFields[0]);
        }
    }

    setVisualizedField(visualizedField: string) {
        this.searchService.searchForVisualization(this.corpus, this.queryModel, visualizedField).then(visual => {
            this.visualizedField = visualizedField;
            this.visualizationType = this.corpus.fields.find(field => field.name == this.visualizedField).visualizationType;
            this.aggResults = visual.aggregations;
        });


    }

    setSelectedVisualization(event) {
        if (event.value.type == 'barchart') {
            this.setVisualizedField(event.value.field.toLowerCase())
            this.freqTable = true;
        }
        else {
            this.freqTable = false;
        }
        this.SelectedVisualization = event.value.type;
    }

    toggleTable() {
        if (this.SelectedVisualization == 'barchart') {
            this.SelectedVisualization = 'freqtable';
        }
        else {
            this.SelectedVisualization = 'barchart';
        }
    }

    showTable() {
        this.SelectedVisualization = 'freqtable';

    }

    showChart() {
        this.SelectedVisualization = 'barchart';

    }

}
