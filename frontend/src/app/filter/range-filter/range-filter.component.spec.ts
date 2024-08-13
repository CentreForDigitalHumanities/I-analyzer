import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../../common-test-bed';

import { SearchService } from '@services';
import * as _ from 'lodash';
import { mockCorpus3, mockField3 } from '../../../mock-data/corpus';
import { QueryModel, RangeFilter } from '@models';
import { SimpleStore } from '../../store/simple-store';
import { RangeFilterComponent } from './range-filter.component';

describe('RangeFilterComponent', () => {
    let component: RangeFilterComponent;
    let searchService: SearchService;
    let fixture: ComponentFixture<RangeFilterComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        searchService = TestBed.inject(SearchService);
        fixture = TestBed.createComponent(RangeFilterComponent);
        component = fixture.componentInstance;
        component.queryModel = new QueryModel(mockCorpus3);
        component.filter = component.queryModel.filterForField(mockField3) as RangeFilter;
        component.filter.set({ min: 1984, max: 1984 });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should use the specified data range', fakeAsync(() => {
        const newFilter = new RangeFilter(new SimpleStore(), mockField3);
        component.onFilterSet(newFilter);

        flushMicrotasks();

        expect(component.min).toEqual(0);
        expect(component.max).toEqual(100);
    }));


    it('should fetch the data range when not specified', fakeAsync(() => {
        const min = 300;
        const max = 400;
        spyOn(searchService, 'aggregateSearch').and.returnValues(
            Promise.resolve(min), Promise.resolve(max)
        );

        const field = _.cloneDeep(mockField3);
        field.filterOptions = {
            name: 'RangeFilter',
            lower: null,
            upper: null,
            description: ''
        };

        const newFilter = new RangeFilter(new SimpleStore(), field);
        component.onFilterSet(newFilter);

        flushMicrotasks();

        expect(component.min).toEqual(min);
        expect(component.max).toEqual(max);
    }));
});
