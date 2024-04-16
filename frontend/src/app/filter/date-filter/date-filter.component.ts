import { Component } from '@angular/core';
import * as _ from 'lodash';

import { DateFilter, DateFilterData, QueryModel } from '../../models';
import { BaseFilterComponent } from '../base-filter.component';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Aggregator, MaxDateAggregator, MinDateAggregator } from '../../models/aggregation';
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
        return this.fetchAggregation(new MinDateAggregator(filter.corpusField));
    }

    private fetchMax(filter: DateFilter): Promise<Date> {
        if (filter.defaultData.max) {
            return Promise.resolve(filter.defaultData.max);
        }
        return this.fetchAggregation(new MaxDateAggregator(filter.corpusField));
    }

    private fetchAggregation<Result>(aggregator: Aggregator<Result>): Promise<Result> {
        const queryModel = new QueryModel(this.queryModel.corpus);
        return this.searchService.aggregateSearch(
            queryModel.corpus, queryModel, aggregator
        );
    }
}
