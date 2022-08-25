import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { Normalizer } from '../../models';

@Component({
    selector: 'ia-barchart-options',
    templateUrl: './barchart-options.component.html',
    styleUrls: ['./barchart-options.component.scss']
})
export class barchartOptionsComponent implements OnChanges {
    @Input() queryText: string;
    @Input() showTokenCountOption: boolean;
    @Input() isLoading: boolean;

    @Input() frequencyMeasure: 'documents'|'tokens' = 'documents';

    currentNormalizer: Normalizer;
    @Output() normalizer = new EventEmitter<Normalizer>();

    public queries: string[] = [];

    showEdit = false;
    @Output() queriesChanged = new EventEmitter<string[]>();
    @Output() clearQueries = new EventEmitter<void>();

    faCheck = faCheck;

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.frequencyMeasure) {
            if (this.frequencyMeasure === 'documents' || !this.showTokenCountOption) {
                this.currentNormalizer = 'raw';
            } else {
                this.currentNormalizer = 'terms';
            }
        }

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

    onNormalizerChange(): void {
        this.normalizer.emit(this.currentNormalizer);
    }

    updateQueries(queries: string[]) {
        this.queries = queries;
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
