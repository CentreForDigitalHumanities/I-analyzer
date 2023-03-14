import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { mockCorpus3, mockFieldDate } from '../../mock-data/corpus';

import { commonTestBed } from '../common-test-bed';
import { PotentialFilter, QueryModel } from '../models';

import { DateFilterComponent } from './date-filter.component';

describe('DateFilterComponent', () => {
  let component: DateFilterComponent;
  let fixture: ComponentFixture<DateFilterComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateFilterComponent);
    component = fixture.componentInstance;
    const queryModel = new QueryModel(mockCorpus3);
    component.filter = new PotentialFilter(mockFieldDate, queryModel);
    component.data = {
        min: new Date('Jan 1 1810'),
        max: new Date('Dec 31 1820')
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
