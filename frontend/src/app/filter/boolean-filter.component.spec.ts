import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { mockCorpus3, mockField } from '../../mock-data/corpus';

import { commonTestBed } from '../common-test-bed';
import { QueryModel } from '../models';

import { BooleanFilterComponent } from './boolean-filter.component';

describe('BooleanFilterComponent', () => {
  let component: BooleanFilterComponent;
  let fixture: ComponentFixture<BooleanFilterComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanFilterComponent);
    component = fixture.componentInstance;
    component.queryModel = new QueryModel(mockCorpus3);
    component.filter = component.queryModel.filterForField(mockField);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
