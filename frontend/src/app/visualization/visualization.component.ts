import { DoCheck, Input, Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, QueryModel, visualizationField } from '../models/index';

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

    public visualExists = false;
    public isLoading = false;
    private childComponentLoading = false;

    public palettes = [
        {
            // previously used for ngram
            label: 'default',
            palette: ['#3F51B5', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499', '#DDDDDD']
        },
        {
            // previously used for related words
            label: 'blue and brown',
            // colour-blind friendly colorPalette retrieved from colorbrewer2.org
            palette: ['#a6611a', '#dfc27d', '#80cdc1', '#018571', '#543005', '#bf812d', '#f6e8c3', '#c7eae5', '#35978f', '#003c30']
        },
        {
            // previously used for word cloud
            label: 'd3 category10',
            // d3 category10 palette
            palette: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf' ]
        },
        {
            // demonstration of single colour - works well for word cloud, not for others
            label: 'black',
            palette: ['#000']
        }
    ];

    public palette = this.palettes[0].palette;

    constructor() {
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
                        this.visualizedFields.push({
                            name: field.name,
                            displayName: field.displayName,
                            visualization: vis,
                            visualizationSort: field.visualizationSort,
                            searchFilter: field.searchFilter,
                            multiFields: field.multiFields,
                        });
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
            if (this.corpus.word_models_present === true && this.queryModel.queryText) {
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
            this.setVisualizedField(this.visualizedField);
        } else {
            this.foundNoVisualsMessage = this.noResults;
        }
    }

    setVisualizedField(selectedField: 'relatedwords'|visualizationField) {
        this.errorMessage = '';
        this.visualExists = true;

        if (selectedField === 'relatedwords') {
            this.visualizedField.visualization = selectedField;
            this.visualizedField.name = selectedField;
            this.visualizedField.displayName = this.visualizationsDisplayNames[selectedField];
        } else {
            this.visualizedField = selectedField;
        }
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

}
