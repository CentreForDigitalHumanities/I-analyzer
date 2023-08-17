import { ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import { mockCorpus3, mockFieldDate } from '../../mock-data/corpus';

import { commonTestBed } from '../common-test-bed';
import { QueryModel } from '../models';
import { DateFilter, DateFilterData } from '../models/search-filter';

import { DateFilterComponent } from './date-filter.component';

describe('DateFilterComponent', () => {
  let component: DateFilterComponent;
  let fixture: ComponentFixture<DateFilterComponent>;
  const exampleData0: DateFilterData = {
    min: new Date(Date.parse('Jan 01 1810')),
    max: new Date(Date.parse('Dec 31 1820'))
  };
  const exampleData1: DateFilterData = {
    min: new Date(Date.parse('Jan 01 1850')),
    max: new Date(Date.parse('Dec 31 1860'))
  };

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateFilterComponent);
    component = fixture.componentInstance;
    component.queryModel = new QueryModel(mockCorpus3);
    component.filter = new DateFilter(mockFieldDate);
    component.filter.set(exampleData0);
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

  it('should create a new update when onFilterSet is called', () => {
    let newFilter = new DateFilter(mockFieldDate);
    newFilter.set(exampleData1);
    component.onFilterSet(newFilter);
    expect(component.selectedMinDate.value).toEqual(exampleData1.min);
    expect(component.selectedMaxDate.value).toEqual(exampleData1.max);
  });
});
