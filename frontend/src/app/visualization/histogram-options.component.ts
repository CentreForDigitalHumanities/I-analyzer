import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
import { histogramOptions } from '../models';

@Component({
    selector: 'ia-histogram-options',
    templateUrl: './histogram-options.component.html',
    styleUrls: ['./histogram-options.component.scss']
})
export class HistogramOptionsComponent implements OnInit {
    @Input() queries: string[];
    @Input() showTokenCountOption: boolean;
    @Output() options = new EventEmitter<histogramOptions>();

    public frequencyMeasure: 'documents'|'tokens' = 'documents';
    public normalizer: 'raw'|'percent'|'documents'|'terms' = 'raw';

    showAddQuery = false;
    newQueryText: string;
    @Output() newQuery = new EventEmitter<string>();
    @Output() clearQueries = new EventEmitter<void>();

    constructor() { }

    ngOnInit(): void {
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
