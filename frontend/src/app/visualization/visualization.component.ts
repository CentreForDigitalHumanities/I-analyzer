import { DoCheck, Input, Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, AggregateResult, MultipleChoiceFilterData, RangeFilterData, QueryModel, visualizationField } from '../models/index';
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

    public visualizedFields: visualizationField[];

    public frequencyMeasure: 'documents'|'tokens' = 'documents';
    public asPercentage: boolean;
    public divideTokenFrequencyBy: 'documents'|'tokens' = 'documents';
    public showTokenCountOption: boolean;

    public showTableButtons: boolean;

    public visualizedField: visualizationField;

    public noResults: string = "Did not find data to visualize."
    public foundNoVisualsMessage: string = this.noResults;
    public errorMessage: string = '';
    public noVisualizations: boolean;

    public visDropdown: SelectItem[];
    public groupedVisualizations: SelectItemGroup[];
    public visualizationType: string;
    public freqtable: boolean = false;
    public visualizationTypeDisplayNames = {
        ngram: 'Common n-grams',
        wordcloud: 'Word cloud',
        timeline: 'Timeline',
        term_frequency: 'Term frequency',
        relatedwords: 'Related words',
        search_term_frequency: 'Frequency of search term',
    };

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
        if (changes['corpus']) {
            this.visualizedFields = [];
            if (this.corpus && this.corpus.fields) {
                this.corpus.fields.filter(field => field.visualizationType).forEach(field => {
                    if (typeof(field.visualizationType) === 'string') {
                        // fields with one visualization type
                        this.visualizedFields.push(field as visualizationField);
                    } else {
                        // fields with multiple visualization types
                        field.visualizationType.forEach(visualizationType => {
                            this.visualizedFields.push({
                                name: field.name,
                                displayName: `${field.displayName}: ${this.visualizationTypeDisplayNames[visualizationType]}`,
                                visualizationType: visualizationType,
                                visualizationSort: field.visualizationSort,
                                searchFilter: field.searchFilter,
                                multiFields: field.multiFields,
                            });
                        });
                    }
                });
            }

            this.visDropdown = [];
            this.visualizedFields.forEach(field => {
                const requires_search_term = ['ngram', 'search_term_frequency']
                    .find(vis_type => vis_type === field.visualizationType);
                if (!requires_search_term || this.queryModel.queryText) {
                    this.visDropdown.push({
                        label: field.displayName,
                        value: {name: field.name, visualizationType: field.visualizationType}
                    });
                }
            });
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
            this.setVisualizedField({
                name: this.visualizedField.name,
                visualizationType: this.visualizedField.visualizationType
            });
            this.disableWordCloudLoadMore = this.resultsCount < this.batchSizeWordcloud;
        }
        else {
            this.aggResults = [];
            this.foundNoVisualsMessage = this.noResults;
        }
    }

    setVisualizedField(selectedField: 'relatedwords'|{name: string, visualizationType: string}) {
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
        } else {
            this.visualizedField = _.cloneDeep(this.visualizedFields.find(field => 
                field.name === selectedField.name && field.visualizationType === selectedField.visualizationType ));
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
        } else if (this.visualizedField.visualizationType !== 'ngram') {
            let size = 0;
            if (this.visualizedField.searchFilter.defaultData.filterType === 'MultipleChoiceFilter') {
                size = (<MultipleChoiceFilterData>this.visualizedField.searchFilter.defaultData).optionCount;
            } else if (this.visualizedField.searchFilter.defaultData.filterType === 'RangeFilter') {
                size = (<RangeFilterData>this.visualizedField.searchFilter.defaultData).max - (<RangeFilterData>this.visualizedField.searchFilter.defaultData).min;
            }
            const aggregator = {name: this.visualizedField.name, size: size};
            if (this.frequencyMeasure == 'documents') {
                this.searchService.aggregateSearch(this.corpus, this.queryModel, [aggregator]).then(visual => {
                    this.aggResults = visual.aggregations[this.visualizedField.name];
                    this.isLoading = false;
                });
            }
            else {
                this.searchService.aggregateTermFrequencySearch(this.corpus, this.queryModel, aggregator).then(visual => {
                    this.showTokenCountOption = visual.data.find(item => item.token_count) !== undefined;

                    this.aggResults = visual.data.map(item => {
                        return {
                            'key': item.key,
                            'doc_count': this.divideTokenFrequencyBy === 'documents' ?
                                (item.match_count / item.doc_count) :
                                (100 * item.match_count / item.token_count)
                        };
                    }).sort((item1, item2) => item2.doc_count - item1.doc_count);
                    
                    this.isLoading = false;
                });
            }
        }
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
            });
        }
    }

    onFrequencyMeasureChange() {
        if (this.visualizedField.visualizationType === 'term_frequency') {
            this.setVisualizedField({
                name: this.visualizedField.name,
                visualizationType: this.visualizedField.visualizationType
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

    onIsLoading(event: boolean) {
        this.childComponentLoading = event;
    }

}
