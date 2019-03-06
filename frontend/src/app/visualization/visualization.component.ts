import { Input, Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from "lodash";

import { Corpus, CorpusField, AggregateResult, QueryModel } from '../models/index';
import { SearchService } from '../services/index';

@Component({
    selector: 'ia-visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnInit, OnChanges {
    @Input() public corpus: Corpus;
    @Input() public queryModel: QueryModel;
    @Input() public resultsCount: number;

    public visualizedFields: CorpusField[];

    public asPercentage: boolean;

    public showTableButtons: boolean;

    public visualizedField: CorpusField;

    public noResults: string = "Did not find data to visualize."
    public foundNoVisualsMessage: string = this.noResults;
    public errorMessage: string = '';
    public noVisualizations: boolean;

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
    public disableWordCloudLoadMore: boolean = false;

    // aggregate search expects a size argument
    public defaultSize: number = 10000;

    private tasksToCancel: string[] = [];

    constructor(private searchService: SearchService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        this.disableWordCloudLoadMore = false;
        if (changes['corpus']){
            this.visualizedFields = this.corpus && this.corpus.fields ?
            this.corpus.fields.filter(field => field.visualizationType != undefined) : [];
            this.visDropdown = this.visualizedFields.map(field => ({
                label: field.displayName,
                value: field.name
            }))
            if (this.corpus.word_models_present == true) {
                this.visDropdown.push({
                    label: 'Related Words',
                    value: 'relatedwords'
                })
            }
            if (this.visualizedFields === undefined) {
                this.noVisualizations = true;
            }
            else {
                this.noVisualizations = false;
                this.visualizedField = _.cloneDeep(this.visualizedFields[0]);
            }   
        }
        else if (changes['queryModel']) {
            this.checkResults();
        }
    }

    ngOnInit() {
        this.checkResults();
        this.showTableButtons = true;
    }

    checkResults() {
        if (this.resultsCount > 0) {
            this.setVisualizedField(this.visualizedField.name);
            this.disableWordCloudLoadMore = this.resultsCount < 1000 ? true : false;
        }
        else {
            this.aggResults = [];
            this.foundNoVisualsMessage = this.noResults;
        }
    }

    setVisualizedField(selectedField: string) {
        if (this.tasksToCancel.length > 0) {
            this.searchService.abortWordCloud(this.tasksToCancel);
            this.tasksToCancel = [];
        }
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
            this.loadWordcloudData(1000);
        }
        else if (this.visualizedField.visualizationType === 'timeline') {
            let aggregator = [{ name: this.visualizedField.name, size: this.defaultSize }];
            this.searchService.aggregateSearch(this.corpus, this.queryModel, aggregator).then(visual => {
                this.aggResults = visual.aggregations[this.visualizedField.name];
            });
        }
        else if (this.visualizedField.visualizationType === 'relatedwords') {
            this.searchService.getRelatedWords(this.queryModel.queryText, this.corpus.name).then(results => {
                this.relatedWordsGraph = results['graphData'];
                this.relatedWordsTable = results['tableData'];
            })
                .catch(error => {
                    this.relatedWordsGraph = undefined;
                    this.relatedWordsTable = undefined;
                    this.foundNoVisualsMessage = this.noResults;
                    this.errorMessage = error['message'];
                });
        }
        else {
            let aggregator = {name: this.visualizedField.name, size: this.defaultSize};
            this.searchService.aggregateSearch(this.corpus, this.queryModel, [aggregator]).then(visual => {
                this.aggResults = visual.aggregations[this.visualizedField.name];
            });
        }
    }

    loadWordcloudData(size: number = null){
        let queryModel = this.queryModel;
        if (queryModel) {
            this.searchService.getWordcloudData(this.visualizedField.name, queryModel, this.corpus.name, size).then(result => {
                // slice is used so the child component fires OnChange
                this.aggResults = result['data'][this.visualizedField.name];
                this.tasksToCancel = result['task_ids']
            })
                .catch(error => {
                    this.foundNoVisualsMessage = this.noResults;
                    this.errorMessage = error['message'];
                });
        }
    }

    setErrorMessage(message: string) {
        this.queryModel = null;
        this.foundNoVisualsMessage = this.noResults;
        this.errorMessage = message;
    }

    showTable() {
        this.freqtable = true;
    }

    showChart() {
        this.freqtable = false;
    }
}
