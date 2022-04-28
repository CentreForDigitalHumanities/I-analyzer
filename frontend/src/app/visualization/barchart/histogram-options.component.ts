import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { histogramOptions } from '../../models';

@Component({
    selector: 'ia-histogram-options',
    templateUrl: './histogram-options.component.html',
    styleUrls: ['./histogram-options.component.scss']
})
export class HistogramOptionsComponent implements OnChanges {
    @Input() queries: string[];
    @Input() showTokenCountOption: boolean;
    @Input() isLoading: boolean;
    @Output() options = new EventEmitter<histogramOptions>();

    public frequencyMeasure: 'documents'|'tokens' = 'documents';
    public normalizer: 'raw'|'percent'|'documents'|'terms' = 'raw';

    showAddQuery = false;
    newQueryText: string;
    disableAddQueries = false;
    @Output() newQuery = new EventEmitter<string>();
    @Output() clearQueries = new EventEmitter<void>();

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queries && changes.queries.previousValue) {
            if (_.every(this.queries, query => query == null) && this.frequencyMeasure === 'tokens') {
                this.frequencyMeasure = 'documents';
                this.onChange('frequencyMeasure');
            }
        }

        this.disableAddQueries = this.isLoading || this.queries && this.queries.length >= 10;
    }

    onChange(parameter: 'frequencyMeasure'|'normalizer'): void {
        if (parameter === 'frequencyMeasure') {
            this.normalizer = 'raw';
        }

        this.options.emit({
            frequencyMeasure: this.frequencyMeasure,
            normalizer: this.normalizer,
        });
    }

    addQuery() {
        this.newQuery.emit(this.newQueryText);
        this.newQueryText = undefined;

    }

    signalClearQueries() {
        this.showAddQuery = false;
        this.clearQueries.emit();
    }

    get showTemFrequency(): boolean {
        return _.some(this.queries);
    }

}
