import { ElementRef, Input, Component, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription }   from 'rxjs';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { Corpus, CorpusField, AggregateResult, AggregateData, QueryModel } from '../models/index';
import { SearchService } from '../services/index';

@Component({
    selector: 'visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnInit, OnChanges {
    @ViewChild('chart') private chartContainer: ElementRef;

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

    public chartElement: any;
    public aggResults: AggregateResult[];

    // aggregate search expects a size argument
    public defaultSize: number = 10000;

    constructor(private searchService: SearchService) {
    }

    ngOnInit() {
        // Initial values
        this.showTableButtons = true;
        this.chartElement = this.chartContainer.nativeElement;
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
            this.setVisualizedField(this.visualizedField);
        }
    }

    setVisualizedField(visualizedField: string) {
        let visualizationType = this.corpus.fields.find(field => field.name === visualizedField).visualizationType;
        if (visualizationType === 'wordcloud') {
            this.searchService.getWordcloudData(visualizedField, this.textFieldContent.find(textField => textField.name === visualizedField).data).then(result =>{
                // slice is used so the child component fires OnChange
                this.aggResults = result[visualizedField].slice(0);
            })
        }
        else if (visualizationType == 'timeline') {
            let aggregator = [{name: visualizedField, size: this.defaultSize}];
            this.searchService.aggregateSearch(this.corpus, this.queryModel, aggregator).then(visual => {
                this.aggResults = visual.aggregations[visualizedField].slice(0);
            });
        }
        else {
            let aggregator = this.multipleChoiceFilters.find(filter => filter.name == visualizedField);
            aggregator = aggregator ? aggregator : {name: visualizedField, size: this.defaultSize};            
            this.searchService.aggregateSearch(this.corpus, this.queryModel, [aggregator]).then(visual => {
                this.aggResults = visual.aggregations[visualizedField].slice(0);
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