import { DoCheck, Input, Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, CorpusField, AggregateResult, MultipleChoiceFilterData, RangeFilterData, QueryModel } from '../models/index';
import { SearchService, ApiService } from '../services/index';

@Component({
    selector: 'ia-visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements DoCheck, OnInit, OnChanges {
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
    };

    public ngramGraph: {
        labels: string[],
        datasets: {
            label: string, data: number[]
        }[]
    };
    ngramSizeOptions = [{label: 'bigrams', value: 2}, {label: 'trigrams', value: 3}];
    ngramSize: number|undefined = undefined;
    ngramPositionOptions = [{label: 'any', value: [0,1]}, {label: 'first', value: [0]}, {label: 'second', value: [1]}];
    ngramPositions: number[]|undefined = undefined;
    ngramFreqCompensationOptions = [{label: 'Yes', value: true}, {label: 'No', value: false}];
    ngramFreqCompensation: boolean|undefined = undefined;
    ngramStemmingOptions = [{label: 'Yes', value: true}, {label: 'No', value: false}];
    ngramStemming: boolean|undefined;
    ngramMaxSizeOptions = [50, 100, 200, 500].map(n => ({label: `${n}`, value: n}));
    ngramMaxSize: number|undefined;

    public disableWordCloudLoadMore: boolean = false;
    public timeline: boolean = false;
    public isLoading: boolean = false;
    private childComponentLoading: boolean = false;

    // aggregate search expects a size argument
    public defaultSize = 10000;
    private batchSizeWordcloud = 1000;

    private tasksToCancel: string[] = [];

    constructor(private searchService: SearchService, private apiService: ApiService) {
    }

    ngDoCheck(){
        if (this.isLoading != this.childComponentLoading ) {
            this.isLoading = this.childComponentLoading;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        this.disableWordCloudLoadMore = false;
        if (changes['corpus']){
            this.visualizedFields = this.corpus && this.corpus.fields ?
            this.corpus.fields.filter(field => field.visualizationType != undefined) : [];
            this.visDropdown = this.visualizedFields.map(field => ({
                label: field.displayName,
                value: field.name
            }));
            if (this.queryModel.queryText) {
                this.visDropdown.push({
                    label: 'Common n-grams',
                    value: 'ngram',
                });
            }
            if (this.corpus.word_models_present == true) {
                this.visDropdown.push({
                    label: 'Related Words',
                    value: 'relatedwords'
                });
            }
            if (this.visualizedFields === undefined) {
                this.noVisualizations = true;
            } else {
                this.noVisualizations = false;
                this.visualizedField = _.cloneDeep(this.visualizedFields[0]);
            }
        } else if (changes['queryModel']) {
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
            this.disableWordCloudLoadMore = this.resultsCount < this.batchSizeWordcloud;
        }
        else {
            this.aggResults = [];
            this.foundNoVisualsMessage = this.noResults;
        }
    }

    setVisualizedField(selectedField: string) {
        this.isLoading = true;
        this.timeline = false;
        if (this.tasksToCancel.length > 0) {
            // the user requests other data, so revoke all running celery tasks
            this.apiService.abortTasks({'task_ids': this.tasksToCancel}).then( result => {
                if (result['success']===true) {
                    this.tasksToCancel = [];
                }
            });
        }
        this.aggResults = [];
        this.errorMessage = '';
        if (selectedField === 'relatedwords') {
            this.visualizedField.visualizationType = selectedField;
            this.visualizedField.name = selectedField;
            this.visualizedField.displayName = 'Related Words';
            this.visualizedField.visualizationSort = 'similarity';
        } else if (selectedField === 'ngram') {
            this.visualizedField.visualizationType = selectedField;
            this.visualizedField.name = selectedField;
            this.visualizedField.displayName = 'Ngrams';
        } else {
            this.visualizedField = _.cloneDeep(this.visualizedFields.find(field => field.name === selectedField));
        }
        this.foundNoVisualsMessage = 'Retrieving data...';
        if (this.visualizedField.visualizationType === 'wordcloud') {
            this.loadWordcloudData(this.batchSizeWordcloud);
            this.isLoading = false;
        } else if (this.visualizedField.visualizationType === 'timeline') {
            this.timeline = true;
        } else if (this.visualizedField.visualizationType === 'relatedwords') {
            this.searchService.getRelatedWords(this.queryModel.queryText, this.corpus.name).then(results => {
                this.relatedWordsGraph = results['graphData'];
                this.relatedWordsTable = results['tableData'];
                this.isLoading = false;
            })
                .catch(error => {
                    this.relatedWordsGraph = undefined;
                    this.relatedWordsTable = undefined;
                    this.foundNoVisualsMessage = this.noResults;
                    this.errorMessage = error['message'];
                    this.isLoading = false;
                });
        } else if (this.visualizedField.visualizationType === 'ngram') {
            this.loadNgramGraph();
        } else {
            let size = 0;
            if (this.visualizedField.searchFilter.defaultData.filterType === 'MultipleChoiceFilter') {
                size = (<MultipleChoiceFilterData>this.visualizedField.searchFilter.defaultData).optionCount;
            } else if (this.visualizedField.searchFilter.defaultData.filterType === 'RangeFilter') {
                size = (<RangeFilterData>this.visualizedField.searchFilter.defaultData).max - (<RangeFilterData>this.visualizedField.searchFilter.defaultData).min;
            }
            const aggregator = {name: this.visualizedField.name, size: size};
            this.searchService.aggregateSearch(this.corpus, this.queryModel, [aggregator]).then(visual => {
                this.aggResults = visual.aggregations[this.visualizedField.name];
                this.isLoading = false;
            });
        }
    }

    onNgramOptionChange(control: 'size'|'position'|'freq_compensation'|'stemming'|'max_size',
                        selection: {value: any, label: string}): void {
        const value = selection.value;
        switch (control) {
            case 'size': {
                this.ngramSize = value;
                // set positions dropdown options and reset its value
                const positions = Array.from(Array(this.ngramSize).keys());
                this.ngramPositionOptions =  [ { value: positions, label: 'any' } ]
                    .concat(positions.map(position => {
                        return { value : [position], label: ['first','second','third'][position] }
                    }));
                this.ngramPositions = this.ngramPositionOptions[0].value;
            }
            case 'position': {
                if (typeof(value) != 'number') {
                    this.ngramPositions = value;
                }
            }
            case 'freq_compensation': {
                this.ngramFreqCompensation = value;
            }
            case 'stemming': {
                this.ngramStemming = value;
            }
            case 'max_size': {
                this.ngramMaxSize = value;
            }
        }

        this.isLoading = true;
        this.loadNgramGraph();
    }

    loadNgramGraph(): void {
        const size = this.ngramSize ? this.ngramSize : this.ngramSizeOptions[0].value;
        const position = this.ngramPositions ? this.ngramPositions : Array.from(Array(size).keys());
        const freqCompensation = this.ngramFreqCompensation ? this.ngramFreqCompensation : this.ngramFreqCompensationOptions[0].value;
        const maxSize = this.ngramMaxSize ? this.ngramMaxSize : 100;

        this.searchService.getNgram(this.queryModel, this.corpus.name, size, position, freqCompensation, maxSize).then(results => {
            this.ngramGraph = results['graphData'];
            this.isLoading = false;
        }).catch(error => {
            this.ngramGraph = undefined;
            this.foundNoVisualsMessage = this.noResults;
            this.errorMessage = error['message'];
            this.isLoading = false;
        });
    }

    loadWordcloudData(size: number = null){
        const queryModel = this.queryModel;
        if (queryModel) {
            this.searchService.getWordcloudData(this.visualizedField.name, queryModel, this.corpus.name, size).then(result => {
                this.aggResults = result[this.visualizedField.name];
            })
            .catch(error => {
                this.foundNoVisualsMessage = this.noResults;
                this.errorMessage = error['message'];
            });
        }
    }

    loadMoreWordcloudData() {
        const queryModel = this.queryModel;
        if (queryModel) {
            this.searchService.getWordcloudTasks(this.visualizedField.name, queryModel, this.corpus.name).then(result => {
                this.tasksToCancel = result['taskIds'];
                    const childTask = result['taskIds'][0];
                    this.apiService.getTaskOutcome({'task_id': childTask}).then( outcome => {
                        if (outcome['success'] === true) {
                            this.aggResults = outcome['results'];
                        } else {
                            this.foundNoVisualsMessage = this.noResults;
                        }
                    });
            })
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

    onIsLoading(event: boolean) {
        this.childComponentLoading = event;
    }

}
