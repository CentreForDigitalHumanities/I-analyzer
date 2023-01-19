import { DoCheck, Input, Component, SimpleChanges, OnChanges } from '@angular/core';
import { SelectItem } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, QueryModel, CorpusField, barChartSetNull, ngramSetNull } from '../models/index';
import { PALETTES } from './select-color';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { DialogService } from '../services';
import * as htmlToImage from 'html-to-image';
import { ParamDirective } from '../param/param-directive';
import { ActivatedRoute, Params, Router } from '@angular/router';



@Component({
    selector: 'ia-visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent extends ParamDirective implements DoCheck, OnChanges {
    @Input() public corpus: Corpus;
    @Input() public queryModel: QueryModel;

    public allVisualizationFields: CorpusField[];

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
    public visualizationTypeDropdownValue: SelectItem;
    public visualizedFieldDropdownValue: SelectItem;

    public visualizations: string [];
    public freqtable = false;
    public visualizationsDisplayNames = {
        resultscount: 'Number of results',
        termfrequency: 'Frequency of the search term',
        ngram: 'Neighbouring words',
        wordcloud: 'Most frequent words',
    };
    public manualPages = {
        ngram: 'ngrams',
        wordcloud: 'wordcloud',
        resultscount: 'numberofresults',
        termfrequency: 'termfrequency',
    };

    public visualExists = false;
    public isLoading = false;
    private childComponentLoading = false;

    public palette: string[];
    public params: Params = {};

    faQuestion = faCircleQuestion;

    constructor(
        private dialogService: DialogService,
        route: ActivatedRoute,
        router: Router
    ) {
        super(route, router);
    }

    ngDoCheck() {
        if (this.isLoading !== this.childComponentLoading ) {
            this.isLoading = this.childComponentLoading;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.queryModel || changes.corpus) {
            this.initialize();
        }
    }

    setupDropdowns() {
        this.allVisualizationFields = [];
        if (this.corpus && this.corpus.fields) {
            this.allVisualizationFields = this.corpus.fields.filter(field => field.visualizations);
        }
        this.visDropdown = [];
        const visualisationTypes = _.uniq(_.flatMap(this.allVisualizationFields, field => field.visualizations));
        const filteredTypes = visualisationTypes.filter(visType => {
            const requiresSearchTerm = ['termfrequency', 'ngram', 'relatedwords']
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
    }

    async initialize() {
        this.setupDropdowns();
        this.showTableButtons = true;
    }

    teardown() {
        /* set all visualization params to null here -
        so all params, also from children are guaranteed to be null */
        this.setParams(
            Object.assign(
                {
                    visualize: null,
                    visualizedField: null
                },
                barChartSetNull,
                ngramSetNull
        ));
    }

    setStateFromParams(params: Params) {
        if (params.has('visualize')) {
            this.setVisualizationType(params.get('visualize'));
            const visualizedField = this.corpus.fields.filter( f => f.name === params.get('visualizedField'))[0];
            this.setVisualizedField(visualizedField);
        } else {
            if (!this.allVisualizationFields.length) {
                this.noVisualizations = true;
            } else {
                this.noVisualizations = false;
                this.setVisualizationType(this.allVisualizationFields[0].visualizations[0]);
                this.updateParams();
            }
        }
        this.visualizationTypeDropdownValue = this.visDropdown.find(
            item => item.value === this.visualizationType) || this.visDropdown[0];
    }

    updateParams() {
        this.params['visualize'] = this.visualizationType;
        this.params['visualizedField'] = this.visualizedField.name;
        this.setParams(this.params);
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
        this.visualizedFieldDropdownValue = this.fieldDropdown.find(
            item => item.value === this.visualizedField) || this.fieldDropdown[0];
    }

    changeVisualizationType(visType: string) {
        this.setVisualizationType(visType);
        this.updateParams();
    }

    setVisualizedField(selectedField: CorpusField) {
        this.errorMessage = '';
        this.visualExists = true;

        this.visualizedField = selectedField;
        this.visualizedFieldDropdownValue = this.fieldDropdown.find(
            item => item.value === this.visualizedField);

        this.foundNoVisualsMessage = 'Retrieving data...';
    }

    changeVisualizedField(selectedField: CorpusField) {
        this.setVisualizedField(selectedField);
        this.updateParams();
    }

    setErrorMessage(message: string) {
        this.visualExists = false;
        this.foundNoVisualsMessage = this.noResults;
        this.errorMessage = message;
    }

    onIsLoading(event: boolean) {
        this.childComponentLoading = event;
    }

    get manualPage(): string {
        if (this.visualizationType) {
            return this.manualPages[this.visualizationType];
        }
    }

    onRequestImage() {
        const filenamestring = `${this.visualizationType}_${this.corpus.name}_${this.visualizedField.name}.png`;
        const node = document.getElementById(this.chartElementId(this.visualizationType));

        htmlToImage.toPng(node)
          .then((dataUrl) => {
            const img = new Image();
            img.src = dataUrl;
            const anchor = document.createElement('a');
            anchor.href = dataUrl;
            anchor.download = filenamestring;
            anchor.click();
          })
          .catch(function(error) {
            this.notificationService.showMessage('oops, something went wrong!', error);
          });

    }

    chartElementId(visualizationType): string {
        if (visualizationType === 'resultscount' || visualizationType === 'termfrequency') {
            return 'barchart';
        }
        if (this.visualizationType === 'ngram') {
            return 'chart';
        }
        if (this.visualizationType === 'wordcloud') {
            return 'wordcloud_div';
        }
    }

    get imageFileName(): string {
        if (this.visualizationType && this.corpus && this.visualizedField) {
            return `${this.visualizationType}_${this.corpus.name}_${this.visualizedField.name}.png`;
        }
    }
}
