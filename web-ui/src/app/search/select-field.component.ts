import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QueryField } from '../models/index';

@Component({
    selector: 'ia-select-field',
    templateUrl: './select-field.component.html',
    styleUrls: ['./select-field.component.scss'],
})
export class SelectFieldComponent implements OnInit {
    @Input() public availableFields: QueryField[];
    @Input() public label: string;
    @Input() public selectAll: boolean;
    @Input() public showSelectedFields: boolean;
    @Output() selectedFields = new EventEmitter<QueryField[]>();
    public allVisible: boolean = false;
    public selectedQueryFields: QueryField[];
    public optionsFields: QueryField[];

    constructor() { }

    ngOnInit() {
        if (this.availableFields!=undefined) {
            this.optionsFields = this.availableFields.filter(field => field.preselected);
            if (this.selectAll) {
                this.selectedQueryFields = this.optionsFields;
            }
        }
    }

    public toggleAllFields() {
        if (this.allVisible) {
            this.optionsFields = this.availableFields.filter(field => field.preselected);
        }
        else {
            this.optionsFields = this.availableFields;
        }
        this.allVisible = !this.allVisible;
    }

    public toggleField() {
        // Searching in different fields also yields different results.
        //this.hasModifiedFilters = true;
        this.selectedFields.emit(this.selectedQueryFields);
    }

}
