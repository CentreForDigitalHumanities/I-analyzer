import { Component } from '@angular/core';
import * as _ from 'lodash';

import { DateFilter, DateFilterData } from '../../models';
import { BaseFilterComponent } from '../base-filter.component';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { MaxDateAggregator, MinDateAggregator } from '../../models/aggregation';
import { SearchService } from '../../services';

@Component({
    selector: 'ia-date-filter',
    templateUrl: './date-filter.component.html',
    styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent extends BaseFilterComponent<DateFilter> {
    public minDate: Date;
    public maxDate: Date;

    public selectedMinDate: BehaviorSubject<Date>;
    public selectedMaxDate: BehaviorSubject<Date>;

    constructor(private searchService: SearchService) {
        super();
    }

    onFilterSet(filter: DateFilter): void {
        this.fetchDefaultData(filter).then(data => {
            filter.setDefaultData(data);
        }).then(() => {
            this.minDate = filter.defaultData.min;
            this.maxDate = filter.defaultData.max;

            this.selectedMinDate = new BehaviorSubject(filter.currentData.min);
            this.selectedMaxDate = new BehaviorSubject(filter.currentData.max);

            combineLatest([this.selectedMinDate, this.selectedMaxDate]).subscribe(([min, max]) =>
                this.update({ min, max })
            );
        });
    }

    private fetchDefaultData(filter: DateFilter): Promise<DateFilterData> {
        return Promise.all(
            [this.fetchMin(filter), this.fetchMax(filter)]
        ).then(([min, max]) => ({min, max}));
    }

    private fetchMin(filter: DateFilter): Promise<Date> {
        if (filter.defaultData.min) {
            return Promise.resolve(filter.defaultData.min);
        }
        const aggregator = new MinDateAggregator(filter.corpusField);
        return this.searchService.aggregateSearch(
            this.queryModel.corpus, this.queryModel, aggregator
        );
    }

    private fetchMax(filter: DateFilter): Promise<Date> {
        if (filter.defaultData.max) {
            return Promise.resolve(filter.defaultData.max);
        }
        const aggregator = new MaxDateAggregator(filter.corpusField);
        return this.searchService.aggregateSearch(
            this.queryModel.corpus, this.queryModel, aggregator
        );
    }

}
