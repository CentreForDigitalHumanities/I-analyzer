import * as _ from "lodash";
import { Component, Input, OnChanges } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { CorpusField } from '../models/index';
import { ParamDirective } from '../param/param-directive';
import { ParamService } from '../services';

@Component({
    selector: 'ia-select-field',
    templateUrl: './select-field.component.html',
    styleUrls: ['./select-field.component.scss'],
})
export class SelectFieldComponent extends ParamDirective implements OnChanges {
    @Input() public filterCriterion: string;
    @Input() public corpusFields: CorpusField[];

    // all fields which are searchable
    private availableFields: CorpusField[];
    // the options displayed at any moment in the dropdown element
    public optionFields: CorpusField[];
    // user selection
    public selectedFields: CorpusField[];
    // string representation of user selection
    public uiSelected: string[];
    // whether to display all field options, or just the core ones
    public allVisible: boolean = false;

    constructor(
        route: ActivatedRoute,
        router: Router,
        private paramService: ParamService) { super(route, router) }

    initialize() {
        this.availableFields = this.getAvailableSearchFields(this.corpusFields);
        this.optionFields = this.filterCoreFields();
    }

    ngOnChanges(): void {
        this.initialize();
    }

    teardown() {
        this.setParams({ fields: null });
    }

    setStateFromParams(params: ParamMap) {
        const queryFields = this.paramService.setSearchFieldsFromParams(params);
        if (!queryFields) {
            this.selectedFields = [];
        } else {
            this.selectedFields = queryFields.map(
                fieldName => this.availableFields.find(field => field.name === fieldName));
        }
    }

    private getAvailableSearchFields(corpusFields: CorpusField[]): CorpusField[] {
        const searchableFields = corpusFields.filter(field => field.searchable);
        const allSearchFields = _.flatMap(searchableFields, this.searchableMultiFields.bind(this)) as CorpusField[];
        return allSearchFields;
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
        }
        else {
            // show all options, with core options first, the rest alphabetically sorted
            let coreFields = this.filterCoreFields();
            let noCoreOptions = _.without(this.availableFields, ... coreFields);
            this.optionFields = coreFields.concat(_.sortBy(noCoreOptions,['displayName']));
        }
        this.allVisible = !this.allVisible;
    }

    public toggleField() {
        this.setParams({ fields: null });
        if (! this.selectedFields ) {
            this.setParams({ fields: null })
        }
        else {
            this.uiSelected = this.selectedFields.map(field => field.name);
            const fields = this.uiSelected.join(',');

            this.setParams({ fields: fields });
        }
    }

    private filterCoreFields() {
        if (this.filterCriterion === 'csv') {
            return this.corpusFields.filter(field => field.csvCore);
        }
        else if (this.filterCriterion === 'searchField') {
            return this.corpusFields.filter(field => field.searchFieldCore);
        }
        else {
            return this.availableFields;
        }
    }
}
