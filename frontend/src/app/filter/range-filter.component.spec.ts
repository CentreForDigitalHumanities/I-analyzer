import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { RangeFilterComponent } from './range-filter.component';
import { PotentialFilter, QueryModel } from '../models';
import { mockCorpus3, mockField3 } from '../../mock-data/corpus';

describe('RangeFilterComponent', () => {
  let component: RangeFilterComponent;
  let fixture: ComponentFixture<RangeFilterComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RangeFilterComponent);
    component = fixture.componentInstance;
    const query = new QueryModel(mockCorpus3);
    component.filter = new PotentialFilter(mockField3, query);
    component.filter.filter.set({min: 1984, max: 1984});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
