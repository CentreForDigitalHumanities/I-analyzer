import { Component, OnDestroy, OnInit } from '@angular/core';

import { RangeFilterData, RangeFilter, QueryModel } from '../../models';
import { BaseFilterComponent } from '../base-filter.component';
import { Subject, interval } from 'rxjs';
import { debounce, takeUntil } from 'rxjs/operators';
import { Aggregator, MaxAggregator, MinAggregator } from '../../models/aggregation';
import { SearchService } from '../../services';

@Component({
    selector: 'ia-range-filter',
    templateUrl: './range-filter.component.html',
    styleUrls: ['./range-filter.component.scss']
})
export class RangeFilterComponent extends BaseFilterComponent<RangeFilter> implements OnInit, OnDestroy {
    min: number;
    max: number;

    sliderValue$ = new Subject<[number, number]>();

    private destroy$ = new Subject<void>();

    constructor(private searchService: SearchService) {
        super();
    }

    ngOnInit(): void {
        this.sliderValue$.pipe(
            takeUntil(this.destroy$),
            debounce(() => interval(300))
        ).subscribe(value =>
            this.update(this.getFilterData(value))
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onFilterSet(filter: RangeFilter): void {
        this.fetchDefaultData(filter).then(data =>
            filter.setDefaultData(data)
        ).then(() => {
            this.min = filter.defaultData.min;
            this.max = filter.defaultData.max;
        });
    }

    getFilterData(value: [number, number]): RangeFilterData {
        return {
            min: value[0],
            max: value[1],
        };
    }

    private fetchDefaultData(filter: RangeFilter): Promise<RangeFilterData> {
        return Promise.all(
            [this.fetchMin(filter), this.fetchMax(filter)]
        ).then(([min, max]) => ({min, max}));
    }

    private fetchMin(filter: RangeFilter): Promise<number> {
        if (filter.defaultData.min) {
            return Promise.resolve(filter.defaultData.min);
        }
        return this.fetchAggregation(new MinAggregator(filter.corpusField));
    }

    private fetchMax(filter: RangeFilter): Promise<number> {
        if (filter.defaultData.max) {
            return Promise.resolve(filter.defaultData.max);
        }
        return this.fetchAggregation(new MaxAggregator(filter.corpusField));
    }

    private fetchAggregation<Result>(aggregator: Aggregator<Result>): Promise<Result> {
        const queryModel = new QueryModel(this.queryModel.corpus);
        return this.searchService.aggregateSearch(
            queryModel.corpus, queryModel, aggregator
        );
    }
}
