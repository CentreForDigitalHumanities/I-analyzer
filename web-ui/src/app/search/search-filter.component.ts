import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CorpusField, SearchFilterData } from '../models/index';

@Component({
    selector: 'search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnChanges, OnInit {
    @Input()
    public field: CorpusField;

    @Input()
    public enabled: boolean;

    @Input()
    public filterData: SearchFilterData;

    @Output('update')
    public updateEmitter = new EventEmitter<SearchFilterData>();

    public get filter() {
        return this.field.searchFilter;
    }

    public data: any;

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['field'] || changes['filterData']) {
            if (changes['field'] && !changes['filterData']) {
                // reset the filter data if the field changed
                this.filterData = null;
            }
            this.fillFilterData();
            if (!changes['filterData']) {
                this.update();
            }
        }
    }

    ngOnInit() {
        if (this.field) {
            this.fillFilterData();

            if (!this.filterData) {
                // default values should also work
                this.update();
            }
        }
    }

    fillFilterData() {
        if (!this.filterData) {
            // unfortunately this isn't typed, so be careful here
            let filterData: any = {
                fieldName: this.field.name,
                filterName: this.filter.name
            };

            switch (this.filter.name) {
                case 'BooleanFilter':
                    filterData.data = false;
                    break;
                case 'MultipleChoiceFilter':
                    filterData.data = [] as string[];
                    break;
                case 'RangeFilter':
                    filterData.data = { gte: this.filter.lower, lte: this.filter.upper };
                    break;
                case 'DateFilter':
                    let padLeft = (n: number) => `0${n}`.slice(-2);
                    let toString = (date: Date) => `${date.getFullYear()}-${padLeft(date.getMonth() + 1)}-${padLeft(date.getDate())}`;
                    filterData.data = { gte: toString(this.filter.lower), lte: toString(this.filter.upper) };
                    break;
            }

            this.filterData = filterData;
        }

        switch (this.filterData.filterName) {
            case 'BooleanFilter':
                this.data = this.filterData.data;
                break;
            case 'RangeFilter':
                this.data = [this.filterData.data.gte, this.filterData.data.lte];
                break;
            case 'MultipleChoiceFilter':
                if (this.filter.name == this.filterData.filterName) {
                    this.data = { options: this.filter.options.map(x => { return { 'label': x, 'value': x } }), selected: this.filterData.data };
                }
                break;
            case 'DateFilter':
                this.data = { min: new Date(this.filterData.data.gte), max: new Date(this.filterData.data.lte), minYear: new Date(this.filterData.data.gte).getFullYear(), maxYear: new Date(this.filterData.data.lte).getFullYear() };
        }
    }

    /**
     * Update the filter data from the user input and trigger a change event.
     */
    update() {
        switch (this.filter.name) {
            case 'BooleanFilter':
                this.filterData = {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: this.data
                };
                break;
            case 'RangeFilter':
                this.filterData = {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: { gte: this.data[0], lte: this.data[1] }
                };
                break;
            case 'MultipleChoiceFilter':
                this.filterData = {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: this.data.selected
                };
                break;
            case 'DateFilter':
                if (!this.data.min) {
                    this.data.min = this.filter.lower;
                }

                if (!this.data.max) {
                    this.data.max = this.filter.upper;
                }

                let formatData = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                this.filterData = {
                    fieldName: this.field.name,
                    filterName: this.filter.name,
                    data: {
                        gte: formatData(this.data.min),
                        lte: formatData(this.data.max)
                    }
                };
                break;
        }
        this.updateEmitter.emit(this.filterData);
    }
}
