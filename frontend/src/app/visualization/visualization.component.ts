import { DoCheck, Input, Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, QueryModel, visualizationField } from '../models/index';
import { PALETTES } from './select-color';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { DialogService } from '../services';

@Component({
    selector: 'ia-visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements DoCheck, OnInit, OnChanges {
    @Input() public corpus: Corpus;
    @Input() public queryModel: QueryModel;
    @Input() public resultsCount: number;

    public allVisualizationFields: visualizationField[];

    public histogramDocumentLimit = 10000;

    public showTableButtons: boolean;

    public visualizationType: string;
    public filteredVisualizationFields: visualizationField[];
    public visualizedField: visualizationField;

    public noResults = 'Did not find data to visualize.';
    public foundNoVisualsMessage: string = this.noResults;
    public errorMessage = '';
    public noVisualizations: boolean;

    public visDropdown: SelectItem[];
    public fieldDropdown: SelectItem[];

    public visualizations: string [];
    public freqtable = false;
    public visualizationsDisplayNames = {
        resultscount: 'Number of results',
        termfrequency: 'Frequency of the search term',
        ngram: 'Neighbouring words',
        wordcloud: 'Most frequent words',
        relatedwords: 'Related words',
    };
    public manualPages = {
        ngram: 'ngrams',
        relatedwords: 'relatedwords',
        wordcloud: 'wordcloud',
        resultscount: 'numberofresults',
        termfrequency: 'termfrequency',
    };


    public visualExists = false;
    public isLoading = false;
    private childComponentLoading = false;

    public palette = PALETTES[0];

    faQuestion = faCircleQuestion;

    constructor(private dialogService: DialogService) {
    }

    ngDoCheck() {
        if (this.isLoading !== this.childComponentLoading ) {
            this.isLoading = this.childComponentLoading;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['corpus']) {
            this.allVisualizationFields = [];
            if (this.corpus && this.corpus.fields) {
                this.corpus.fields.filter(field => field.visualizations).forEach(field => {
                    field.visualizations.forEach(vis => {
                        // for relatedwords, only inlcude if word models are present
                        if (vis !== 'relatedwords' || this.corpus.word_models_present) {
                            this.allVisualizationFields.push({
                                name: field.name,
                                displayName: field.displayName,
                                displayType: field.displayType,
                                visualization: vis,
                                visualizationSort: field.visualizationSort,
                                searchFilter: field.searchFilter,
                                multiFields: field.multiFields,
                            });
                        }
                    });
                });
            }
            this.visDropdown = [];

            const visualisationTypes = _.uniq(this.allVisualizationFields.map(field => field.visualization));
            const filteredTypes = visualisationTypes.filter(visType => {
                const requiresSearchTerm = ['termfrequency', 'ngram', 'relatedwords']
                    .find(vis => vis === visType);
                return !requiresSearchTerm || this.queryModel.queryText;
            });
            filteredTypes.forEach(visType =>
                this.visDropdown.push({
                    label: this.visualizationsDisplayNames[visType],
                    value: visType
                })
            );

            if (!this.allVisualizationFields) {
                this.noVisualizations = true;
            } else {
                this.noVisualizations = false;
                this.setVisualizationType(this.allVisualizationFields[0].visualization);
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
            this.setVisualizedField(this.visualizedField);
        } else {
            this.foundNoVisualsMessage = this.noResults;
        }
    }

    setVisualizationType(visType: string) {
        this.visualizationType = visType;
        this.filteredVisualizationFields = this.allVisualizationFields.filter(field =>
            field.visualization === visType
        );
        this.fieldDropdown = this.filteredVisualizationFields.map(field => ({
            label: field.displayName || field.name,
            value: field
        }));
        this.visualizedField = this.filteredVisualizationFields[0];
    }

    setVisualizedField(selectedField: visualizationField) {
        this.errorMessage = '';
        this.visualExists = true;

        this.visualizedField = selectedField;
        this.foundNoVisualsMessage = 'Retrieving data...';
    }

    setErrorMessage(message: string) {
        this.visualExists = false;
        this.foundNoVisualsMessage = this.noResults;
        this.errorMessage = message;
    }

    onIsLoading(event: boolean) {
        this.childComponentLoading = event;
    }

    showHelp() {
        const manualPage = this.manualPages[this.visualizedField.visualization];
        this.dialogService.showManualPage(manualPage);
    }

}
