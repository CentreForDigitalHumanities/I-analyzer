import { Component, OnDestroy, OnInit } from '@angular/core';

import { RangeFilterData, RangeFilter } from '../../models';
import { BaseFilterComponent } from '../base-filter.component';
import { Subject, interval } from 'rxjs';
import { debounce, takeUntil } from 'rxjs/operators';
import { MaxAggregator, MinAggregator } from '../../models/aggregation';
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
        const aggregator = new MinAggregator(filter.corpusField);
        return this.searchService.aggregateSearch(
            this.queryModel.corpus, this.queryModel, aggregator
        );
    }

    private fetchMax(filter: RangeFilter): Promise<number> {
        if (filter.defaultData.max) {
            return Promise.resolve(filter.defaultData.max);
        }
        const aggregator = new MaxAggregator(filter.corpusField);
        return this.searchService.aggregateSearch(
            this.queryModel.corpus, this.queryModel, aggregator
        );
    }
}
