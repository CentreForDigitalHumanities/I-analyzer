import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CorpusField } from '../models/index';

import * as _ from "lodash";

@Component({
    selector: 'ia-select-field',
    templateUrl: './select-field.component.html',
    styleUrls: ['./select-field.component.scss'],
})
export class SelectFieldComponent implements OnInit {
    @Input() public availableFields: CorpusField[];
    @Input() public filterCriterion: string;
    @Input() public label: string;
    @Input() public selectAll: boolean;
    @Input() public showSelectedFields: boolean;
    @Input() public fieldsFromParams: CorpusField[];
    @Output() selectedFields = new EventEmitter<CorpusField[]>();
    public allVisible: boolean = false;
    public selectedQueryFields: CorpusField[];
    public optionsFields: CorpusField[];

    constructor() { }

    ngOnInit() {
        if (this.availableFields !== undefined && this.filterCriterion !== undefined) {
            this.filterCoreFields();
            if (this.selectAll) {
                this.selectedQueryFields = this.optionsFields;
            }
            else if (this.fieldsFromParams === undefined) {
                this.selectedQueryFields = [];
            }
        }       
    }

    ngOnChanges() {
        if (this.fieldsFromParams !== undefined) {
            this.selectedQueryFields = this.fieldsFromParams;
        }
    }

    public toggleAllFields() {
        if (this.allVisible) {
            this.filterCoreFields();
        }
        else {
            // show all options, with core options first, the rest alphabetically sorted
            let noCoreOptions = _.without(this.availableFields, ... this.optionsFields);
            this.optionsFields = this.optionsFields.concat(_.sortBy(noCoreOptions,['displayName']));
        }
        this.allVisible = !this.allVisible;
    }

    public toggleField() {
        this.selectedFields.emit(this.selectedQueryFields);
    }

    private filterCoreFields() {
        if (this.filterCriterion === 'csv') {
            this.optionsFields = this.availableFields.filter(field => field.csvCore);
        }
        else if (this.filterCriterion === 'searchField') {
            this.optionsFields = this.availableFields.filter(field => field.searchFieldCore);
        }
        else {
            this.optionsFields = this.availableFields;
        } 
    }
}
