/* eslint-disable @typescript-eslint/member-ordering */
import * as _ from 'lodash';
import { Component, DestroyRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CorpusField, QueryModel } from '@models/index';
import { actionIcons } from '@shared/icons';
import { searchFieldOptions } from '@utils/search-fields';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'ia-select-field',
    templateUrl: './select-field.component.html',
    styleUrls: ['./select-field.component.scss'],
    standalone: false
})
export class SelectFieldComponent implements OnChanges {
    @Input({ required: true }) queryModel!: QueryModel;

    /** searchable fields */
    private availableFields: CorpusField[];
    /** the options displayed in the dropdown element */
    public optionFields: CorpusField[];
    /** user selection */
    selectedFields: CorpusField[];
    /** whether to display all field options, or just the core ones */
    public allVisible = false;

    actionIcons = actionIcons;

    constructor(private destroyRef: DestroyRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel) {
            this.availableFields = searchFieldOptions(this.queryModel.corpus);
            this.setOptionFields();
            this.setStateFromQueryModel();
            this.queryModel.update.pipe(
                takeUntilDestroyed(this.destroyRef),
            ).subscribe(() => this.setStateFromQueryModel());
        }
    }

    setStateFromQueryModel() {
        if (this.queryModel.searchFields) {
            this.selectedFields = _.clone(this.queryModel.searchFields);
        } else {
            this.selectedFields = [];
        }
    }

    public toggleAllFields() {
        this.allVisible = !this.allVisible;
        this.setOptionFields();
    }

    public onUpdate() {
        this.queryModel.setParams({
            searchFields: this.selectedFields
        });
    }

    setOptionFields() {
        if (this.allVisible) {
            this.optionFields = this.availableFields.sort(f => f.searchFieldCore ? 0 : 1);
        } else {
            this.optionFields = this.availableFields.filter(f => f.searchFieldCore);
        }
    }
}
