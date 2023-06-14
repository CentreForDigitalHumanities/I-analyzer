/* eslint-disable @typescript-eslint/member-ordering */
import * as _ from 'lodash';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CorpusField, QueryModel } from '../models/index';

@Component({
    selector: 'ia-select-field',
    templateUrl: './select-field.component.html',
    styleUrls: ['./select-field.component.scss'],
})
export class SelectFieldComponent implements OnChanges {
    @Input() queryModel: QueryModel;
    @Input() public filterCriterion: 'searchable'|'downloadable';
    @Input() public corpusFields: CorpusField[];
    @Output() selection = new EventEmitter<CorpusField[]>();

    // all fields which are searchable/downloadable
    private availableFields: CorpusField[];
    // the options displayed at any moment in the dropdown element
    public optionFields: CorpusField[];
    // user selection
    selectedFields: CorpusField[];
    // whether to display all field options, or just the core ones
    public allVisible = false;

    constructor() {}

    initialize() {
        if (this.queryModel) {
            this.setStateFromQueryModel(this.queryModel);
        } else {
            this.selectedFields = this.filterCoreFields();
        }
        this.availableFields = this.getAvailableFields(this.corpusFields);
        this.optionFields = this.filterCoreFields();
    }

    ngOnChanges(): void {
        this.initialize();
    }

    setStateFromQueryModel(queryModel: QueryModel) {
        if (queryModel.searchFields) {
            this.selectedFields = _.clone(queryModel.searchFields);
        } else {
            this.selectedFields = [];
        }
    }

    private getAvailableFields(corpusFields: CorpusField[]): CorpusField[] {
        const availableFields = corpusFields.filter(field => field[this.filterCriterion]);
        if (this.filterCriterion === 'searchable') {
            return _.flatMap(availableFields, this.searchableMultiFields.bind(this)) as CorpusField[];
        } else {
            return availableFields;
        }
    }

    private searchableMultiFields(field: CorpusField): CorpusField[] {
        if (field.multiFields) {
            if (field.multiFields.includes('text')) {
                // replace keyword field with text multifield
                return this.useTextMultifield(field);
            }
            if (field.multiFields.includes('stemmed')) {
                return this.useStemmedMultifield(field);
            }
        }
        return [field];
    }

    private useTextMultifield(field: CorpusField) {
        const textField = _.clone(field);
        textField.name = field.name + '.text';
        textField.multiFields = null;
        return [textField];
    }

    private useStemmedMultifield(field: CorpusField) {
        const stemmedField = _.clone(field);
        stemmedField.name = field.name + '.stemmed';
        stemmedField.displayName = field.displayName + ' (stemmed)';
        stemmedField.multiFields = null;

        return [field, stemmedField];
    }

    public toggleAllFields() {
        if (this.allVisible) {
            this.optionFields = this.filterCoreFields();
        } else {
            // show all options, with core options first, the rest alphabetically sorted
            const coreFields = this.filterCoreFields();
            const noCoreOptions = _.without(this.availableFields, ... coreFields);
            this.optionFields = coreFields.concat(_.sortBy(noCoreOptions,['displayName']));
        }
        this.allVisible = !this.allVisible;
        this.onUpdate();
    }

    public onUpdate() {
        this.selection.emit(this.selectedFields);
        if (this.queryModel) {
            this.queryModel.searchFields = this.selectedFields;
            this.queryModel.update.next();
        }
    }

    private filterCoreFields() {
        if (this.filterCriterion === 'downloadable') {
            return this.corpusFields.filter(field => field.csvCore);
        } else if (this.filterCriterion === 'searchable') {
            return this.corpusFields.filter(field => field.searchFieldCore);
        } else {
            return this.availableFields;
        }
    }
}
