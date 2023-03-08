import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-term-comparison-editor',
    templateUrl: './term-comparison-editor.component.html',
    styleUrls: ['./term-comparison-editor.component.scss']
})
export class TermComparisonEditorComponent implements OnChanges {
    @Input() initialValue = []; // starting value
    @Input() termLimit = 10;

    queries: string[] = [];
    public showReset = false;

    @Output() queriesChanged = new EventEmitter<string[]>();
    @Output() clearQueries = new EventEmitter<void>();

    faCheck = faCheck;

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        this.queries = this.initialValue;
        if (this.queries.length > 1) {
            this.showReset = true;
        }
    }

    confirmQueries() {
        this.queriesChanged.emit(this.queries);
        this.showReset = true;
    }

    signalClearQueries() {
        this.queries = this.initialValue;
        this.clearQueries.emit();
        this.showReset = false;
    }


    get disableConfirm(): boolean {
        if (!this.queries || !this.queries.length) {
            return false;
        }
        return this.queries.length >= this.termLimit;
    }
}
