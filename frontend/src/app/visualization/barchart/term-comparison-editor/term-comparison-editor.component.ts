import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { ParamDirective } from '../../../param/param-directive';
import { ParamService } from '../../../services';
import { formIcons } from '../../../shared/icons';

@Component({
    selector: 'ia-term-comparison-editor',
    templateUrl: './term-comparison-editor.component.html',
    styleUrls: ['./term-comparison-editor.component.scss'],
})
export class TermComparisonEditorComponent
    extends ParamDirective
    implements OnChanges {
    @Input() initialValue = []; // starting value
    @Input() termLimit = 10;

    @Output() queriesChanged = new EventEmitter<string[]>();
    @Output() clearQueries = new EventEmitter<void>();

    queries: string[] = [];
    public showReset = false;
    nullableParameters = ['compareTerm'];

    formIcons = formIcons;

    constructor(
        route: ActivatedRoute,
        router: Router,
        paramService: ParamService
    ) {
        super(route, router, paramService);
    }

    get disableConfirm(): boolean {
        if (!this.queries || !this.queries.length) {
            return false;
        }
        return this.queries.length >= this.termLimit;
    }

    initialize() {}

    teardown() {}

    setStateFromParams(params: ParamMap) {
        if (params.has('compareTerm')) {
            this.queries = params.getAll('compareTerm');
            this.queriesChanged.emit(this.queries);
            this.showReset = true;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.queries = this.initialValue;
        if (this.queries.length > 1) {
            this.showReset = true;
        }
    }

    confirmQueries() {
        this.setParams({ compareTerm: this.queries });
        this.queriesChanged.emit(this.queries);
        this.showReset = true;
    }

    signalClearQueries() {
        this.queries = this.initialValue;
        this.clearQueries.emit();
        this.showReset = false;
    }
}
