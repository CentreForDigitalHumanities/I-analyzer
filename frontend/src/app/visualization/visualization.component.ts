import { DoCheck, Input, Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, QueryModel, CorpusField } from '../models/index';
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

    public allVisualizationFields: CorpusField[];

    public histogramDocumentLimit = 10000;

    public showTableButtons: boolean;

    public visualizationType: string;
    public filteredVisualizationFields: CorpusField[];
    public visualizedField: CorpusField;

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
        wordcontext: 'Word context',
    };
    public manualPages = {
        ngram: 'ngrams',
        relatedwords: 'relatedwords',
        wordcloud: 'wordcloud',
        resultscount: 'numberofresults',
        termfrequency: 'termfrequency',
        wordcontext: 'wordcontext'
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
                this.allVisualizationFields = this.corpus.fields.filter(field => field.visualizations);
            }
            this.visDropdown = [];

            const visualisationTypes = _.uniq(_.flatMap(this.allVisualizationFields, field => field.visualizations));
            const filteredTypes = visualisationTypes.filter(visType => {
                const requiresSearchTerm = ['termfrequency', 'ngram', 'relatedwords', 'wordcontext']
                    .find(vis => vis === visType);
                const searchTermSatisfied = !requiresSearchTerm || this.queryModel.queryText;
                const wordModelsSatisfied = visType !== 'relatedwords' || this.corpus.word_models_present;
                return searchTermSatisfied && wordModelsSatisfied;
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
                this.setVisualizationType(this.allVisualizationFields[0].visualizations[0]);
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
            field.visualizations.includes(visType)
        );
        this.fieldDropdown = this.filteredVisualizationFields.map(field => ({
            label: field.displayName || field.name,
            value: field
        }));
        this.visualizedField = this.filteredVisualizationFields[0];
    }

    setVisualizedField(selectedField: CorpusField) {
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
        const manualPage = this.manualPages[this.visualizationType];
        this.dialogService.showManualPage(manualPage);
    }



    onRequestImage() {
        const filenamestring = `${this.visualizationType}_${this.corpus.name}_${this.visualizedField.name}.png`;
        const node = document.getElementById(this.chartElementId(this.visualizationType));

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
        if (visualizationType === 'resultscount' || visualizationType === 'termfrequency') {
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
