import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { mockCorpus, mockFieldMultipleChoice } from '../../mock-data/corpus';

import { commonTestBed } from '../common-test-bed';
import { PotentialFilter, QueryModel } from '../models';

import { MultipleChoiceFilterComponent } from './multiple-choice-filter.component';

describe('MultipleChoiceFilterComponent', () => {
  let component: MultipleChoiceFilterComponent;
  let fixture: ComponentFixture<MultipleChoiceFilterComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleChoiceFilterComponent);
    component = fixture.componentInstance;
    component.options = [{value: 'Andy', label: 'Andy', doc_count: 2}, {value: 'Lou', label: 'Lou', doc_count: 3}];
    const query = new QueryModel(mockCorpus);
    component.filter = new PotentialFilter(mockFieldMultipleChoice, query);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
