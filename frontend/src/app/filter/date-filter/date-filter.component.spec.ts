import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, waitForAsync } from '@angular/core/testing';
import { mockCorpus3, mockFieldDate } from '../../../mock-data/corpus';

import { commonTestBed } from '../../common-test-bed';
import { DateFilter, DateFilterData, QueryModel } from '@models';

import { DateFilterComponent } from './date-filter.component';
import { SimpleStore } from '../../store/simple-store';
import { SearchService } from '@services';
import * as _ from 'lodash';

describe('DateFilterComponent', () => {
    let component: DateFilterComponent;
    let searchService: SearchService;
    let fixture: ComponentFixture<DateFilterComponent>;
    const exampleData1: DateFilterData = {
        min: new Date('Jan 01 1850'),
        max: new Date('Dec 31 1860')
    };

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        searchService = TestBed.inject(SearchService);
        fixture = TestBed.createComponent(DateFilterComponent);
        component = fixture.componentInstance;
        component.queryModel = new QueryModel(mockCorpus3);
        component.filter = component.queryModel.filterForField(mockFieldDate) as DateFilter;
        component.filter.set({
            min: new Date('Jan 1 1810'),
            max: new Date('Dec 31 1820')
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should react to setting filter', () => {
        component.filter.set(exampleData1);

        expect(component.filter.currentData.min).toEqual(exampleData1.min);
        expect(component.filter.currentData.max).toEqual(exampleData1.max);
    });

    it('should create a new update when onFilterSet is called', fakeAsync(() => {
        spyOn(searchService, 'aggregateSearch').and.returnValue(
            Promise.resolve(new Date(Date.now()))
        );

        const newFilter = new DateFilter(new SimpleStore(), mockFieldDate);
        newFilter.set(exampleData1);
        component.onFilterSet(newFilter);

        flushMicrotasks();

        expect(component.selectedMinDate.value).toEqual(exampleData1.min);
        expect(component.selectedMaxDate.value).toEqual(exampleData1.max);
    }));

    it('should use the specified data range', fakeAsync(() => {
        const newFilter = new DateFilter(new SimpleStore(), mockFieldDate);
        component.onFilterSet(newFilter);

        flushMicrotasks();

        expect(component.minDate.getDate())
            .toEqual(new Date(Date.parse('1800-01-01')).getDate());
        expect(component.maxDate.getDate())
            .toEqual(new Date(Date.parse('1899-12-31')).getDate());
    }));

    it('should fetch the data range when not specified', fakeAsync(() => {
        const minDate = new Date(Date.parse('1820-01-01'));
        const maxDate = new Date(Date.parse('1880-01-01'));
        spyOn(searchService, 'aggregateSearch').and.returnValues(
            Promise.resolve(minDate), Promise.resolve(maxDate)
        );

        const field = _.cloneDeep(mockFieldDate);
        field.filterOptions = {
            name: 'DateFilter',
            lower: null,
            upper: null,
            description: ''
        };

        const newFilter = new DateFilter(new SimpleStore(), field);
        component.onFilterSet(newFilter);

        flushMicrotasks();

        expect(component.minDate).toEqual(minDate);
        expect(component.maxDate).toEqual(maxDate);
    }));
});
