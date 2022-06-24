import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { barchartOptions } from '../../models';

@Component({
    selector: 'ia-barchart-options',
    templateUrl: './barchart-options.component.html',
    styleUrls: ['./barchart-options.component.scss']
})
export class barchartOptionsComponent implements OnChanges {
    @Input() queryText: string;
    @Input() showTokenCountOption: boolean;
    @Input() isLoading: boolean;
    @Output() options = new EventEmitter<barchartOptions>();

    public frequencyMeasure: 'documents'|'tokens' = 'documents';
    public normalizer: 'raw'|'percent'|'documents'|'terms' = 'raw';

    public queries: string[] = [];

    showEdit = false;
    @Output() queriesChanged = new EventEmitter<string[]>();
    @Output() clearQueries = new EventEmitter<void>();

    faCheck = faCheck;

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryText) {
            if (this.queryText) {
                this.queries = [this.queryText];
            } else {
                this.queries = [];
            }
        }

        if (changes.showTokenCountOption && changes.showTokenCountOption.currentValue && this.frequencyMeasure === 'tokens') {
            this.normalizer = 'terms';
        }
    }

    onChange(parameter: 'frequencyMeasure'|'normalizer'): void {
        if (parameter === 'frequencyMeasure') {
            if (this.frequencyMeasure === 'documents' || !this.showTokenCountOption) {
                this.normalizer = 'raw';
            } else {
                this.normalizer = 'terms';
            }
        }

        this.options.emit({
            frequencyMeasure: this.frequencyMeasure,
            normalizer: this.normalizer,
        });
    }

    confirmQueries() {
        if (this.queries.length === 1 && this.queries[0] === this.queryText) {
            this.showEdit = false;
        }
        this.queriesChanged.emit(this.queries);
    }

    signalClearQueries() {
        this.queries = [this.queryText];
        this.showEdit = false;
        this.clearQueries.emit();
    }

    get showTermFrequency(): boolean {
        return _.some(this.queries);
    }

    get disableConfirm(): boolean {
        if (this.isLoading || !this.queries || !this.queries.length) { return false; }
        return this.queries.length >= 10;
    }

}
