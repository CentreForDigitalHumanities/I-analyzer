import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CorpusField, SearchFilterData } from '../models/index';

@Component({
    selector: 'search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnInit {
    @Input()
    public field: CorpusField;

    @Input()
    public enabled: boolean;

    @Output('update')
    public updateEmitter = new EventEmitter<SearchFilterData>();

    public get filter() {
        return this.field.searchFilter;
    }

    public data: any;

    constructor() { }

    ngOnInit() {
        // TODO: it might be nicer to listen to changes in filter property instead
        switch (this.filter.name) {
            case 'BooleanFilter':
                this.data = '1';
                break;
            case 'RangeFilter':
                this.data = { min: this.filter.lower, max: this.filter.upper };
                break;
            case 'MultipleChoiceFilter':
                this.data = {};
                for (let option of this.filter.options) {
                    this.data[option] = false;
                }
                break;
        }
        // default values should also work
        this.update();
    }

    update() {
        let filterData: SearchFilterData;
        switch (this.filter.name) {
            case 'BooleanFilter':
                // TODO
                throw 'not implemented!';
            case 'RangeFilter':
                filterData = {
                    'range':
                    {
                        [this.field.name]: { gte: this.data.min, lte: this.data.max }
                    }
                };
                break;
            case 'MultipleChoiceFilter':
                filterData = {
                    'terms':
                    {
                        [this.field.name]: Object.keys(this.data).filter(option => this.data[option])
                    }
                };
                break;
            case 'DateFilter':
                // TODO
                throw 'not implemented!';
        }

        this.updateEmitter.emit(filterData);
    }

}
