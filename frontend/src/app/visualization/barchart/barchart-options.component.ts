import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { ParamDirective } from '../../param/param-directive';
import { Normalizer, barChartSetNull, ChartType, ChartParameters } from '../../models';

@Component({
    selector: 'ia-barchart-options',
    templateUrl: './barchart-options.component.html',
    styleUrls: ['./barchart-options.component.scss']
})
export class BarchartOptionsComponent extends ParamDirective implements OnChanges {
    @Input() queryText: string;
    @Input() showTokenCountOption: boolean;
    @Input() isLoading: boolean;

    @Input() freqTable: boolean;

    @Input() frequencyMeasure: 'documents'|'tokens' = 'documents';

    @Input() histogram: boolean;

    currentNormalizer: Normalizer;

    currentChartType: ChartType = 'bar';

    @Output() chartParameters = new EventEmitter<ChartParameters>();

    public queries: string[] = [];

    showEdit = false;
    @Output() queriesChanged = new EventEmitter<string[]>();
    @Output() clearQueries = new EventEmitter<void>();

    faCheck = faCheck;

    constructor(
        route: ActivatedRoute,
        router: Router
    ) {
        super(route, router);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryText) {
            if (this.queryText) {
                this.queries = [this.queryText];
            } else {
                this.queries = [];
            }
        }

        if (changes.showTokenCountOption && changes.showTokenCountOption.currentValue && this.frequencyMeasure === 'tokens') {
            this.currentNormalizer = 'terms';
        }
    }

    onChartParametersChange(): void {
        const chartParameters: ChartParameters = {
            normalizer: this.currentNormalizer,
            chartType: this.currentChartType
        }
        this.chartParameters.emit(chartParameters);
        const route = {};
        if (this.currentNormalizer !== 'raw' || 'terms') {
            route['normalize'] = this.currentNormalizer;
        } else {
            route['normalize'] = null;
            }

        this.setParams(route);
    }

    initialize() {}

    teardown() {
        this.setParams(barChartSetNull);
    }

    setStateFromParams(params: Params) {
        if (params.has('normalize')) {
            this.currentNormalizer = params.get('normalize') as Normalizer;
        } else {
            if (this.frequencyMeasure === 'documents' || !this.showTokenCountOption) {
                this.currentNormalizer = 'raw';
            } else {
                this.currentNormalizer = 'terms';
            }
        }
        if (params.has('visualizeTerm')) {
            this.queries = params.getAll('visualizeTerm');
            this.showEdit = true;
            this.queriesChanged.emit(this.queries);
        }
    }

    updateQueries(queries: string[]) {
        this.queries = queries;
        if (this.queries.length === 1 && this.queries[0] === this.queryText) {
            this.showEdit = false;
        }
        this.setParams({visualizeTerm: this.queries});
        this.queriesChanged.emit(this.queries);
    }

    signalClearQueries() {
        this.queries = [this.queryText];
        this.showEdit = false;
        this.setParams({visualizeTerm: null});
        this.clearQueries.emit();
    }

    get showTermFrequency(): boolean {
        return _.some(this.queries);
    }
}
