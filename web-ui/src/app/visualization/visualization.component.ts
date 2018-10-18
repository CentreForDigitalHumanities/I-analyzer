import { ElementRef, Input, Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Subscription }   from 'rxjs';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { Corpus, CorpusField, AggregateResult, QueryModel } from '../models/index';
import { SearchService } from '../services/index';

@Component({
    selector: 'visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnInit, OnChanges {
    @Input() public queryModel: QueryModel;
    @Input() public corpus: Corpus;
    @Input() public textFieldContent: {name: string, data: string[]}[];
    @Input() public multipleChoiceFilters: {name: string, size: number}[];


    public visualizedFields: CorpusField[];

    public asPercentage: boolean;

    public showTableButtons: boolean;

    public visualizedField: string;

    public visDropdown: SelectItem[];
    public groupedVisualizations: SelectItemGroup[];
    public visualizationType: string;
    public freqtable: boolean = false;

    public aggResults: AggregateResult[];
    // aggregate search expects a size argument
    public defaultSize: number = 10000;

    constructor(private searchService: SearchService) {
    }

    ngOnInit() {
        // Initial values
        this.showTableButtons = true;
        this.visualizedFields = this.corpus && this.corpus.fields ? 
            this.corpus.fields.filter(field => field.visualizationType != undefined) : [];
        this.visDropdown = this.visualizedFields.map(field => ({
            label: field.displayName,
            value: {
                field: field.name
            }
        }))
        this.setVisualizedField(this.visualizedFields[0].name);
    }

    ngOnChanges() {
        if (this.visualizedField) {
            this.aggResults = [];
            this.setVisualizedField(this.visualizedField);
        }
    }

    setVisualizedField(visualizedField: string) {
        let visualizationType = this.corpus.fields.find(field => field.name === visualizedField).visualizationType;
        if (visualizationType === 'wordcloud') {
            if (this.textFieldContent[0].data.length == 0) {
                this.aggResults = [];
            }
            else {
                this.searchService.getWordcloudData(visualizedField, this.textFieldContent.find(
                    textField => textField.name === visualizedField).data).then(result => {
                    this.aggResults = result[visualizedField];
                })
            }
        }
        else if (visualizationType == 'timeline') {
            let aggregator = [{name: visualizedField, size: this.defaultSize}];
            this.searchService.aggregateSearch(this.corpus, this.queryModel, aggregator).then(visual => {
                this.aggResults = visual.aggregations[visualizedField];
            });
        }
        else {
            let aggregator = this.multipleChoiceFilters.find(filter => filter.name == visualizedField);
            aggregator = aggregator ? aggregator : {name: visualizedField, size: this.defaultSize};            
            this.searchService.aggregateSearch(this.corpus, this.queryModel, [aggregator]).then(visual => {
                this.aggResults = visual.aggregations[visualizedField];
            });
        }
        this.visualizedField = visualizedField;
        this.visualizationType = visualizationType;
    }

    showTable() {
        this.freqtable = true;
    }

    showChart() {
        this.freqtable = false;
        this.setVisualizedField(this.visualizedField);
    }
}