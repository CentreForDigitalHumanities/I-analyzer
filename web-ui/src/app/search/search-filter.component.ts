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

    @Output('update')
    public updateEmitter = new EventEmitter<SearchFilterData>();

    public get filter() {
        return this.field.searchFilter;
    }

    public data: any;
    public trueCondition: boolean = false;

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['field']) {
            this.fillFilterData();
        }
    }

    ngOnInit() {
        if (this.field) {
            this.fillFilterData();
        }
    }

    fillFilterData() {
        switch (this.filter.name) {
            case 'BooleanFilter':
                break;
            case 'RangeFilter':
                this.data = [this.filter.lower, this.filter.upper];
                break;
            case 'MultipleChoiceFilter':
                this.data = { options: this.filter.options.map(x => { return { 'label': x, 'value': x } }), selected: [] };
                break;
            case 'DateFilter':
                this.data = { min: this.filter.lower, max: this.filter.upper };
        }
        // default values should also work
        this.update();
    }

    update() {
        let filterData: SearchFilterData;
        switch (this.filter.name) {
            case 'BooleanFilter':
                filterData = {
                    'term': {
                        [this.field.name]: this.trueCondition
                    }
                };
                break;
            case 'RangeFilter':
                filterData = {
                    'range':
                    {
                        [this.field.name]: { gte: this.data[0], lte: this.data[1] }
                    }
                };
                break;
            case 'MultipleChoiceFilter':
                filterData = {
                    'terms':
                    {
                        [this.field.name]: this.data.selected
                    }
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
                filterData = {
                    'range':
                    {
                        [this.field.name]: {
                            gte: formatData(this.data.min),
                            lte: formatData(this.data.max),
                            format: 'yyyy-MM-dd'
                        }
                    }
                };
                break;
        }

        this.updateEmitter.emit(filterData);
    }

}
