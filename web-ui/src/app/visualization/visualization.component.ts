import { Input, Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription }   from 'rxjs';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from "lodash";

import { Corpus, CorpusField, AggregateResult, SearchResults } from '../models/index';
import { SearchService, DataService } from '../services/index';

@Component({
    selector: 'ia-visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})

export class VisualizationComponent implements OnInit, OnDestroy {
    @Input() public corpus: Corpus;
    @Input() public multipleChoiceFilters: {name: string, size: number}[];

    public visualizedFields: CorpusField[];

    public asPercentage: boolean;

    public showTableButtons: boolean;

    public visualizedField: CorpusField;

    public noResults: string = "Did not find data to visualize."
    public foundNoVisualsMessage: string = this.noResults;
    public errorMessage: string = '';

    public visDropdown: SelectItem[];
    public groupedVisualizations: SelectItemGroup[];
    public visualizationType: string;
    public freqtable: boolean = false;

    public aggResults: AggregateResult[];
    public relatedWordsGraph: {
        labels: string[], 
        datasets: {
            label: string, data: number[]
        }[]
    };
    public relatedWordsTable: {
        [word: string]: number
    }
    public searchResults: SearchResults;

    // aggregate search expects a size argument
    public defaultSize: number = 10000;

    public subscription: Subscription;

    constructor(private searchService: SearchService, private dataService: DataService) {
    }

    ngOnInit() {
        // Initial values
        this.visualizedFields = this.corpus && this.corpus.fields ? 
            this.corpus.fields.filter(field => field.visualizationType != undefined) : [];
        this.visDropdown = this.visualizedFields.map(field => ({
            label: field.displayName,
            value: field.name
        }))
        // this is very hacky:
        // word models only exist for dutchbanking for now
        if (this.corpus.name=="dutchbanking") {
            this.visDropdown.push({
                label: 'Related Words',
                value: 'relatedwords'
            })
        }
        this.visualizedField = _.cloneDeep(this.visualizedFields[0]);
        // subscribe to data service pushing new search results
        this.subscription = this.dataService.searchResults$.subscribe(results => {
            if (results.total > 0) {
                this.searchResults = results;
                this.setVisualizedField(this.visualizedField.name);
            }
            else {
                this.aggResults = [];
            }
        });
        this.showTableButtons = true;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    setVisualizedField(selectedField: string) {
        this.aggResults = [];
        this.errorMessage = '';
        if (selectedField == 'relatedwords') {
            this.visualizedField.visualizationType = selectedField;
            this.visualizedField.name = selectedField;
            this.visualizedField.displayName = 'Related Words';
            this.visualizedField.visualizationSort = 'similarity';
            }
        else {
            this.visualizedField = _.cloneDeep(this.visualizedFields.find(field => field.name === selectedField));
        }
        this.foundNoVisualsMessage = "Retrieving data..."
        if (this.visualizedField.visualizationType === 'wordcloud') {
            let textFieldContent = this.searchResults.documents.map(d => d.fieldValues[this.visualizedField.name]);
            if (textFieldContent.length > 0) {
                this.searchService.getWordcloudData(this.visualizedField.name, textFieldContent).then(result => {
                    // slice is used so the child component fires OnChange
                    this.aggResults = result[this.visualizedField.name].slice(0);
                })
                .catch(error => {
                    this.foundNoVisualsMessage = this.noResults;
                    this.errorMessage = error['message'];
                });
            }
        }
        else if (this.visualizedField.visualizationType === 'timeline') {
            let aggregator = [{name: this.visualizedField.name, size: this.defaultSize}];
            this.searchService.aggregateSearch(this.corpus, this.searchResults.queryModel, aggregator).then(visual => {
                this.aggResults = visual.aggregations[this.visualizedField.name];
            });
        }
        else if (this.visualizedField.visualizationType === 'relatedwords') {
            this.searchService.getRelatedWords(this.searchResults.queryModel.queryText, this.corpus.name).then(results => {
                this.relatedWordsGraph = results['graphData'];
                this.relatedWordsTable = results['tableData'];
            })
            .catch(error => {
                this.foundNoVisualsMessage = this.noResults;
                this.errorMessage = error['message'];
            });
        }
        else {
            let aggregator = this.multipleChoiceFilters.find(filter => filter.name === this.visualizedField.name);
            aggregator = aggregator ? aggregator : {name: this.visualizedField.name, size: this.defaultSize};            
            this.searchService.aggregateSearch(this.corpus, this.searchResults.queryModel, [aggregator]).then(visual => {
                this.aggResults = visual.aggregations[this.visualizedField.name];
            });
        }
    }
    

    showTable() {
        this.freqtable = true;
    }

    showChart() {
        this.freqtable = false;
    }
}
