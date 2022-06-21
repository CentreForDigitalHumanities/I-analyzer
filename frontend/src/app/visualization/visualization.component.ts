import { DoCheck, Input, Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, QueryModel, visualizationField } from '../models/index';
import { PALETTES } from './select-color';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { DialogService } from '../services';
import * as htmlToImage from 'html-to-image';

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

    public histogramDocumentLimit = 10000;

    public showTableButtons: boolean;

    public visualizedField: visualizationField;

    public noResults = 'Did not find data to visualize.';
    public foundNoVisualsMessage: string = this.noResults;
    public errorMessage = '';
    public noVisualizations: boolean;

    public visDropdown: SelectItem[];
    public groupedVisualizations: SelectItemGroup[];
    public visualizations: string [];
    public freqtable = false;
    public visualizationsDisplayNames = {
        ngram: 'common n-grams',
        wordcloud: 'wordcloud',
        timeline: 'timeline',
        histogram: 'histogram',
        relatedwords: 'Related words',
    };
    public manualPages = {
        ngram: 'ngrams',
        relatedwords: 'relatedwords',
        wordcloud: 'wordcloud',
        timeline: 'histogram',
        histogram: 'histogram'
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
            this.visualizedFields = [];
            if (this.corpus && this.corpus.fields) {
                this.corpus.fields.filter(field => field.visualizations).forEach(field => {
                    field.visualizations.forEach(vis => {
                        // for relatedwords, only inlcude if word models are present
                        if (vis != 'relatedwords' || this.corpus.word_models_present) {
                            this.visualizedFields.push({
                                name: field.name,
                                displayName: field.displayName,
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
            this.visualizedFields.forEach(field => {
                const requires_search_term = ['ngram', 'relatedwords']
                    .find(vis_type => vis_type === field.visualization);
                if (!requires_search_term || this.queryModel.queryText) {
                    this.visDropdown.push({
                        label: `${field.displayName} (${this.visualizationsDisplayNames[field.visualization]})`,
                        value: field
                    });
                }
            });

            if (!this.visualizedFields) {
                this.noVisualizations = true;
            } else {
                this.noVisualizations = false;
                this.visualizedField = this.visualizedFields[0];
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

    

    onRequestImage() {
        const filenamestring = `${this.visualizedField.visualization}_${this.corpus.name}_${this.visualizedField.name}.png`;
        const node = document.getElementById(this.chartElementId(this.visualizedField.visualization));
        
        htmlToImage.toPng(node)
          .then(function (dataUrl) {
            var img = new Image();
            img.src = dataUrl;
            var anchor = document.createElement("a");
            anchor.href = dataUrl;   
            anchor.download = filenamestring;
            anchor.click();
          })
          .catch(function (error) {
            this.notificationService.showMessage('oops, something went wrong!', error);
          });   
        
    }
    chartElementId(visualizationType): string {
        if (visualizationType === 'timeline' || visualizationType === 'histogram') {
            return 'barchart';
        }
        if (visualizationType === 'ngram') {
            return 'chart';
        }
        if (visualizationType === 'wordcloud') {
            return 'wordcloud_div';
        }
    }
}
