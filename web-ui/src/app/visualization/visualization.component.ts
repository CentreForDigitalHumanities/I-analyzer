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

    public showTableButtons: boolean;

    public selectedVisualization: string;
    public visualizedField: string;

    public groupedVisualizations: SelectItemGroup[];
    public visualizedFields: string[];
    public visualizationType: string;

    public chartElement: any;

    public aggResults: {
        key: {};
        doc_count: number;
        key_as_string?: string;
    }[];

    constructor(private searchService: SearchService) {
        // Holds options for the dropdown menu of visualizations
        this.groupedVisualizations = [
            {
                label: 'Histograms',
                items: [
                    { label: 'Date', value: { field: 'date' } },
                    { label: 'Category', value: { field: 'category' } },
                ]
            }
        ]
    }

    ngOnInit() {
        // Initial values 
        this.selectedVisualization = 'timeline';
        this.showTableButtons = true;
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

    showTable() {
        this.visualizationType = 'freqtable';
    }

    showChart() {
        this.setVisualizedField(this.visualizedField);
    }
}
