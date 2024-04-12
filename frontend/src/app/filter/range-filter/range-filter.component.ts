import { Component, OnDestroy, OnInit } from '@angular/core';

import { RangeFilterData, RangeFilter } from '../../models';
import { BaseFilterComponent } from '../base-filter.component';
import { Subject, interval } from 'rxjs';
import { debounce, takeUntil } from 'rxjs/operators';

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

    ngOnInit(): void {
        this.sliderValue$.pipe(
            takeUntil(this.destroy$),
            debounce(() => interval(300))
        ).subscribe(value =>
            this.update(this.getFilterData(value))
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next(undefined);
        this.destroy$.complete();
    }

    onFilterSet(filter: RangeFilter): void {
        this.min = filter.defaultData.min;
        this.max = filter.defaultData.max;
    }

    getFilterData(value: [number, number]): RangeFilterData {
        return {
            min: value[0],
            max: value[1],
        };
    }

}
