import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { Corpus, FreqTableHeaders, QueryModel, CorpusField, NgramResults, NgramParameters, ngramSetNull } from '../../models';
import { ApiService, ChartOptionsService, VisualizationService } from '../../services';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ParamDirective } from '../../param/param-directive';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';

@Component({
    selector: 'ia-ngram',
    templateUrl: './ngram.component.html',
    styleUrls: ['./ngram.component.scss']
})
export class NgramComponent extends ParamDirective implements OnChanges {
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() visualizedField: CorpusField;
    @Input() asTable: boolean;
    @Input() palette: string[];
    @Output() isLoading = new EventEmitter<boolean>();
    @Output() error = new EventEmitter<string>();

    allDateFields: CorpusField[];
    dateField: CorpusField;

    @ViewChild('chart-container') chartContainer: ElementRef;

    tableHeaders: FreqTableHeaders = [
        { key: 'date', label: 'Date', isMainFactor: true, },
        { key: 'ngram', label: 'N-gram', isSecondaryFactor: true, },
        { key: 'freq', label: 'Frequency', format: this.formatValue, formatDownload: this.formatDownloadValue }
    ];
    tableData: { date: string; ngram: string; freq: number }[];

    currentResults: NgramResults;
    chartTitle: Object;

    // options
    sizeOptions = [{label: 'bigrams', value: 2}, {label: 'trigrams', value: 3}, {label: 'fourgrams', value: 4}];
    positionsOptions = ['any', 'first', 'second'].map(n => ({label: `${n}`, value: n}));
    freqCompensationOptions = [{label: 'No', value: false}, {label: 'Yes', value: true}];
    analysisOptions: {label: string; value: string}[];
    maxDocumentsOptions = [50, 100, 200, 500].map(n => ({label: `${n}`, value: n}));
    numberOfNgramsOptions = [10, 20, 50, 100].map(n => ({label: `${n}`, value: n}));

    tasksToCancel: string[];

    resultsCache: {[parameters: string]: any} = {};
    currentParameters: NgramParameters;
    lastParameters: NgramParameters;
    parametersChanged = false;

    faCheck = faCheck;
    faTimes = faTimes;

    constructor(
        private apiService: ApiService,
        private chartOptionsService: ChartOptionsService,
        private visualizationService: VisualizationService,
        route: ActivatedRoute,
        router: Router
    ) {
        super(route, router);
    }

    initialize(): void {

    }

    teardown(): void {
        this.apiService.abortTasks({task_ids: this.tasksToCancel});
        this.setParams(ngramSetNull);
    }

    setStateFromParams(params: ParamMap) {
        this.setParameters(params);
        this.setupChartTitle();
        this.loadGraph();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel || changes.visualizedField) {
            this.resultsCache = {};
            this.allDateFields = this.corpus.fields.filter(field => field.mappingType === 'date');
            this.dateField = this.allDateFields[0];
            if (this.visualizedField.multiFields) {
                this.analysisOptions = [{label: 'None', value: 'none'}]
                    .concat(this.visualizedField.multiFields.map(subfield => {
                        const displayStrings = { clean: 'Remove stopwords', stemmed: 'Stem and remove stopwords'};
                        return { value: subfield, label: displayStrings[subfield]};
                    }));
            } else {
                this.analysisOptions = undefined;
            }
        }

        if (this.currentParameters) {
            this.loadGraph();
        }
    }

    setParameters(params: Params) {
        this.currentParameters = {
            size: parseInt(params.get('size'), 10) || this.sizeOptions[0].value,
            positions: params.get('positions') || this.positionsOptions[0].value,
            freqCompensation: params.get('freqCompensation') !==  undefined ?
                params.get('freqCompensation') === 'true' :
                this.freqCompensationOptions[0].value,
            analysis: params.get('analysis') || 'none',
            maxDocuments: parseInt(params.get('maxDocuments'), 10) || 50,
            numberOfNgrams: parseInt(params.get('numberOfNgrams'), 10) || 10,
            dateField: params.get('dateField') || 'date',
        };
    }

    setupChartTitle() {
        this.chartTitle = this.chartOptionsService.getChartHeader(
            'Most frequent collocations', this.corpus.name, this.queryModel.queryText,
            this.queryModel, this.parametersToString()
        )
    }

    parametersToString(): string {
        return [
            `size=${this.currentParameters.size}`,
            `positions=${this.currentParameters.positions}`,
            `freqCompensation=${this.currentParameters.freqCompensation}`,
            `analysis=${this.currentParameters.analysis}`,
            `maxDocuments=${this.currentParameters.maxDocuments}`,
            `numberOfNgrams=${this.currentParameters.numberOfNgrams}`,
            `dateField=${this.currentParameters.dateField}`
        ].join(',')

    }

    loadGraph() {
        this.isLoading.emit(true);

        this.lastParameters = _.clone(this.currentParameters);
        const cachedResult = this.getCachedResult(this.currentParameters);

        if (cachedResult) {
            this.onDataLoaded(cachedResult);
        } else {
            this.visualizationService.getNgramTasks(this.queryModel, this.corpus.name, this.visualizedField.name,
                this.currentParameters)
                .then(response => {
                    if (response.success) {
                        this.tasksToCancel = response.task_ids;
                        this.apiService.pollTasks<NgramResults>(response.task_ids).then(outcome => {
                            if (outcome.success === true && outcome.done === true) {
                                const result = outcome.results[0];
                                this.cacheResult(result, this.currentParameters);
                                this.onDataLoaded(result as NgramResults);
                            } else {
                                this.onFailure(outcome['message']);
                            }
                        });
                    } else {
                        this.onFailure(response['message']);
                    }
            }).catch(response => {
                const body = response.body as string;
                const message = body.slice(body.lastIndexOf('<p>') + 3, body.lastIndexOf('</p>'));
                this.onFailure(message);
            });
        }
    }

    onFailure(message: string) {
        this.currentResults = undefined;
        this.error.emit(message);
        this.isLoading.emit(false);
    }

    onDataLoaded(result: NgramResults) {
        this.currentResults = result;
        this.tableData = this.makeTableData(result);

        this.isLoading.emit(false);
    }

    makeTableData(result: NgramResults): any[] {
        return _.flatMap(
            result.time_points.map((date, index) => result.words.map(dataset => ({
                    date,
                    ngram: dataset.label,
                    freq: dataset.data[index],
                })))
        );
    }

    cacheResult(result: any, params: NgramParameters): void {
        const key = this.parametersKey(params);
        this.resultsCache[key] = result;
    }

    getCachedResult(params: NgramParameters): any {
        const key = this.parametersKey(params);
        if (_.has(this.resultsCache, key)) {
            return this.resultsCache[key];
        }
    }

    parametersKey(params: NgramParameters): string {
        const values = _.values(params);
        return _.join(values, '/');
    }

    setPositionsOptions(size) {
        // set positions dropdown options and reset its value
        this.positionsOptions =  ['any'].concat(['first', 'second', 'third', 'fourth'].slice(0, size)).map(
            item => ({ value: item, label: item }));
        this.currentParameters.positions = this.positionsOptions[0].value;
    }


    onParameterChange(parameter: string, value: any) {
        this.currentParameters[parameter] = value;

        if (parameter === 'size' && value) {
            this.setPositionsOptions(value);
        }

        this.parametersChanged = true;
    }

    cancelChanges() {
        this.setPositionsOptions(this.lastParameters.size);
        this.currentParameters = this.lastParameters;
        this.parametersChanged = false;
    }

    confirmChanges() {
        this.parametersChanged = false;
        this.setParams(this.currentParameters);
    }

    get currentSizeOption() {
        if (this.currentParameters) {
            return this.sizeOptions.find(item => item.value === this.currentParameters.size);
        }
    }

    get currentPositionsOption() {
        if (this.currentParameters) {
            return this.positionsOptions.find(item => item.value === this.currentParameters.positions);
        }
    }

    get currentFreqCompensationOption() {
        if (this.currentParameters) {
            return this.freqCompensationOptions.find(item => item.value === this.currentParameters.freqCompensation);
        }
    }

    get currentAnalysisOption() {
        if (this.currentParameters) {
            return this.analysisOptions.find(item => item.value === this.currentParameters.analysis);
        }
    }

    get currentMaxDocumentsOption() {
        if (this.currentParameters) {
            return this.maxDocumentsOptions.find(item => item.value === this.currentParameters.maxDocuments);
        }
    }

    get currentNumberOfNgramsOption() {
        if (this.currentParameters) {
            return this.numberOfNgramsOptions.find(item => item.value === this.currentParameters.numberOfNgrams);
        }
    }

    formatValue(value: number): string {
        if (value === 0) {
            return '0';
        }

        return `${value.toPrecision(3)}`;
    }

    formatDownloadValue(value: number): string {
        if (value === 0) {
            return '0';
        }

        return `${value}`;
    }
}
