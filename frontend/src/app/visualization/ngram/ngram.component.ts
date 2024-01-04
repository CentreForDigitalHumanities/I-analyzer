import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { Corpus, FreqTableHeaders, QueryModel, CorpusField, NgramResults, NgramParameters } from '../../models';
import { ApiService, NotificationService, ParamService, VisualizationService } from '../../services';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ParamDirective } from '../../param/param-directive';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';

@Component({
    selector: 'ia-ngram',
    templateUrl: './ngram.component.html',
    styleUrls: ['./ngram.component.scss'],
})
export class NgramComponent extends ParamDirective implements OnChanges {
    @Input() queryModel: QueryModel;
    @Input() corpus: Corpus;
    @Input() visualizedField: CorpusField;
    @Input() asTable: boolean;
    @Input() palette: string[];
    @Output() isLoading = new EventEmitter<boolean>();
    @Output() ngramError = new EventEmitter<string>();

    @ViewChild('chart-container') chartContainer: ElementRef;

    allDateFields: CorpusField[];
    dateField: CorpusField;

    tableHeaders: FreqTableHeaders = [
        { key: 'date', label: 'Date', isMainFactor: true },
        { key: 'ngram', label: 'N-gram', isSecondaryFactor: true },
        {
            key: 'freq',
            label: 'Frequency',
            format: this.formatValue,
            formatDownload: this.formatDownloadValue,
        },
    ];
    tableData: { date: string; ngram: string; freq: number }[];

    currentResults: NgramResults;

    // options
    sizeOptions = [
        { label: 'bigrams', value: 2 },
        { label: 'trigrams', value: 3 },
        { label: 'fourgrams', value: 4 },
    ];
    positionsOptions = ['any', 'first', 'second'].map((n) => ({
        label: `${n}`,
        value: n,
    }));
    freqCompensationOptions = [
        { label: 'No', value: false },
        { label: 'Yes', value: true },
    ];
    analysisOptions: { label: string; value: string }[];
    maxDocumentsOptions = [50, 100, 200, 500].map((n) => ({
        label: `${n}`,
        value: n,
    }));
    numberOfNgramsOptions = [10, 20, 50, 100].map((n) => ({
        label: `${n}`,
        value: n,
    }));

    tasksToCancel: string[];

    resultsCache: { [parameters: string]: any } = {};
    currentParameters: NgramParameters;
    lastParameters: NgramParameters;
    parametersChanged = false;
    ngramSettings: string[];

    faCheck = faCheck;
    faTimes = faTimes;

    nullableParameters = ['ngramSettings'];

    constructor(
        private apiService: ApiService,
        private visualizationService: VisualizationService,
        private notificationService: NotificationService,
        route: ActivatedRoute,
        router: Router,
        paramService: ParamService
    ) {
        super(route, router, paramService);
        this.currentParameters = new NgramParameters(
            this.sizeOptions[0].value,
            this.positionsOptions[0].value,
            this.freqCompensationOptions[0].value,
            'none',
            this.maxDocumentsOptions[0].value,
            this.numberOfNgramsOptions[0].value,
            'date'
        );
    }

    get currentSizeOption() {
        if (this.currentParameters) {
            return this.sizeOptions.find(
                (item) => item.value === this.currentParameters.size
            );
        }
    }

    get currentPositionsOption() {
        if (this.currentParameters) {
            return this.positionsOptions.find(
                (item) => item.value === this.currentParameters.positions
            );
        }
    }

    get currentFreqCompensationOption() {
        if (this.currentParameters) {
            return this.freqCompensationOptions.find(
                (item) => item.value === this.currentParameters.freqCompensation
            );
        }
    }

    get currentAnalysisOption() {
        if (this.currentParameters) {
            return this.analysisOptions.find(
                (item) => item.value === this.currentParameters.analysis
            );
        }
    }

    get currentMaxDocumentsOption() {
        if (this.currentParameters) {
            return this.maxDocumentsOptions.find(
                (item) => item.value === this.currentParameters.maxDocuments
            );
        }
    }

    get currentNumberOfNgramsOption() {
        if (this.currentParameters) {
            return this.numberOfNgramsOptions.find(
                (item) => item.value === this.currentParameters.numberOfNgrams
            );
        }
    }

    initialize() {}

    teardown(): void {
        this.apiService.abortTasks({ task_ids: this.tasksToCancel });
    }

    setStateFromParams(params: ParamMap) {
        this.setParameters(params);
        this.loadGraph();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel || changes.visualizedField) {
            this.resultsCache = {};
            this.allDateFields = this.corpus.fields.filter(
                (field) => field.mappingType === 'date'
            );
            this.dateField = this.allDateFields[0];
            this.currentParameters.dateField = this.dateField.name;
            if (this.visualizedField.multiFields) {
                this.analysisOptions = [
                    { label: 'None', value: 'none' },
                ].concat(
                    this.visualizedField.multiFields.map((subfield) => {
                        const displayStrings = {
                            clean: 'Remove stopwords',
                            stemmed: 'Stem and remove stopwords',
                        };
                        return {
                            value: subfield,
                            label: displayStrings[subfield],
                        };
                    })
                );
            } else {
                this.analysisOptions = undefined;
            }
        }

        if (this.currentParameters) {
            this.loadGraph();
        }
    }

    setParameters(params: Params) {
        const ngramSettings = params.get('ngramSettings');
        if (ngramSettings) {
            this.currentParameters.fromRouteParam(ngramSettings);
        }
    }

    loadGraph() {
        this.isLoading.emit(true);

        this.lastParameters = _.clone(this.currentParameters);
        const cachedResult = this.getCachedResult(this.currentParameters);

        if (cachedResult) {
            this.onDataLoaded(cachedResult);
        } else {
            this.visualizationService
                .getNgramTasks(
                    this.queryModel,
                    this.corpus,
                    this.visualizedField.name,
                    this.currentParameters
                )
                .then((response) => {
                    this.tasksToCancel = response.task_ids;
                    return this.apiService.pollTasks<NgramResults>(
                        response.task_ids
                    );
                })
                .then(([result]) => {
                    this.tasksToCancel = undefined;
                    this.cacheResult(result, this.currentParameters);
                    this.onDataLoaded(result);
                })
                .catch(this.onFailure.bind(this));
        }
    }

    onFailure(error: { message: string }) {
        console.log(error);
        this.currentResults = undefined;
        this.ngramError.emit(error.message);
        this.isLoading.emit(false);
    }

    onDataLoaded(result: NgramResults) {
        this.currentResults = result;
        this.tableData = this.makeTableData(result);

        this.isLoading.emit(false);
    }

    makeTableData(result: NgramResults): any[] {
        return _.flatMap(
            result.time_points.map((date, index) =>
                result.words.map((dataset) => ({
                    date,
                    ngram: dataset.label,
                    freq: dataset.data[index],
                }))
            )
        );
    }

    cacheResult(result: any, params: NgramParameters): void {
        const key = params.toRouteParam();
        this.resultsCache[key] = result;
    }

    getCachedResult(params: NgramParameters): any {
        const key = params.toRouteParam();
        if (_.has(this.resultsCache, key)) {
            return this.resultsCache[key];
        }
    }

    setPositionsOptions(size) {
        // set positions dropdown options and reset its value
        this.positionsOptions = ['any']
            .concat(['first', 'second', 'third', 'fourth'].slice(0, size))
            .map((item) => ({ value: item, label: item }));
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
        this.setParams({
            ngramSettings: this.currentParameters.toRouteParam(),
        });
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

    requestFullData() {
        const parameters = this.visualizationService.makeNgramRequestParameters(
            this.corpus,
            this.queryModel,
            this.visualizedField.name,
            this.currentParameters
        );
        this.apiService
            .requestFullData({
                corpus_name: this.corpus.name,
                visualization: 'ngram',
                parameters,
            })
            .then(() =>
                this.notificationService.showMessage(
                    'Full data requested! You will receive an email when your download is ready.',
                    'success',
                    {
                        text: 'view downloads',
                        route: ['/download-history'],
                    }
                )
            )
            .catch((error) => {
                console.error(error);
                this.notificationService.showMessage(
                    'Could not set up data generation.',
                    'danger'
                );
            });
    }
}
