import { DoCheck, Input, Component, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { SelectItem } from 'primeng/api';
import * as _ from 'lodash';

import { Corpus, QueryModel, CorpusField } from '../models/index';
import { faChartColumn, faTable } from '@fortawesome/free-solid-svg-icons';
import { ParamDirective } from '../param/param-directive';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { findByName } from '../utils/utils';
import { ParamService } from '../services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';



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

    icons = {
        chart: faChartColumn,
        table: faTable,
    };

    public visualExists = false;
    public isLoading = false;
    private childComponentLoading = false;

    public palette: string[];
    public params: Params = {};

    nullableParameters = ['visualize', 'visualizedField'];

    reset$ = new Subject<void>();
    destroy$ = new Subject<void>();

    constructor(
        route: ActivatedRoute,
        router: Router,
        paramService: ParamService
    ) {
        super(route, router, paramService);
    }

    ngDoCheck() {
        if (this.isLoading !== this.childComponentLoading ) {
            this.isLoading = this.childComponentLoading;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.queryModel || changes.corpus) {
            this.reset$.next();
            this.initialize();
        }
    }

    setVistypeDropdown() {
        this.allVisualizationFields = [];
        if (this.corpus && this.corpus.fields) {
            this.allVisualizationFields = this.corpus.fields.filter(field => field.visualizations?.length);
        }
        const visualisationTypes = _.uniq(_.flatMap(this.allVisualizationFields, field => field.visualizations));
        const filteredTypes = visualisationTypes.filter(vt =>
            this.includeVisualisationType(vt, this.queryModel)
        );
        this.visDropdown = this.vistypesToDropdown(filteredTypes);
    }

    initialize() {
        this.refreshVisualisations();
        this.queryModel?.update.pipe(
            takeUntil(this.destroy$),
            takeUntil(this.reset$)
        ).subscribe(() => this.refreshVisualisations());
    }

    refreshVisualisations() {
        this.setVistypeDropdown();
        this.showTableButtons = true;
        if (!this.allVisualizationFields.length) {
            this.noVisualizations = true;
        } else {
            this.noVisualizations = false;
            this.setVisualizationType(this.allVisualizationFields[0].visualizations[0]);
            this.updateParams();
        }
    }

    teardown() {
        this.reset$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    setStateFromParams(params: Params) {
        if (params.has('visualize')) {
            this.setVisualizationType(params.get('visualize'));
            const visualizedField = findByName(this.corpus.fields, params.get('visualizedField'));
            this.setVisualizedField(visualizedField);
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
        this.fieldDropdown = this.fieldsToDropdown(this.filteredVisualizationFields);
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

    get chartElementId(): string {
        if (this.visualizationType === 'resultscount' || this.visualizationType === 'termfrequency') {
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

    private includeVisualisationType(visType: string, queryModel: QueryModel): boolean {
        const requiresSearchTerm = _.includes(['termfrequency', 'ngram'], visType);
        return !requiresSearchTerm || !!queryModel.queryText;
    }

    private vistypesToDropdown(visTypes: string[]): { label: string; value: string}[] {
        return visTypes.map(visType => ({
            label: this.visualizationsDisplayNames[visType],
            value: visType
        }));
    }

    private fieldsToDropdown(fields: CorpusField[]): { label: string; value: CorpusField }[] {
        return fields.map(field => ({
            label: field.displayName || field.name,
            value: field
        }));
    }
}
