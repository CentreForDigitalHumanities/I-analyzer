/* eslint-disable @typescript-eslint/member-ordering */
import * as _ from 'lodash';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CorpusField, QueryModel } from '@models/index';
import { actionIcons } from '@shared/icons';
import { searchFieldOptions } from '@utils/search-fields';

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
    private coreFields: CorpusField[];
    /** the options displayed in the dropdown element */
    public optionFields: CorpusField[];
    /** user selection */
    selectedFields: CorpusField[];
    /** whether to display all field options, or just the core ones */
    public allVisible = false;

    actionIcons = actionIcons;

    constructor() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel) {
            this.availableFields = searchFieldOptions(this.queryModel.corpus);
            this.coreFields = this.availableFields.filter(f => f.searchFieldCore);
            this.optionFields = this.coreFields;
            this.setStateFromQueryModel(this.queryModel);
        }
    }

    setStateFromQueryModel(queryModel: QueryModel) {
        if (queryModel.searchFields) {
            this.selectedFields = _.clone(queryModel.searchFields);
        } else {
            this.selectedFields = [];
        }
    }

    public toggleAllFields() {
        if (this.allVisible) {
            this.optionFields = this.coreFields;
        } else {
            this.optionFields = this.availableFields.sort(f => f.searchFieldCore ? 0 : 1);
        }
        this.allVisible = !this.allVisible;
    }

    public onUpdate() {
        this.queryModel.setParams({
            searchFields: this.selectedFields
        });
    }
}
