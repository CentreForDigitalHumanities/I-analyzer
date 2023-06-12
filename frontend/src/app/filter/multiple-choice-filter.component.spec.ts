import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { mockCorpus, mockFieldMultipleChoice } from '../../mock-data/corpus';

import { commonTestBed } from '../common-test-bed';
import { QueryModel } from '../models';

import { MultipleChoiceFilterComponent } from './multiple-choice-filter.component';
import * as _ from 'lodash';

describe('MultipleChoiceFilterComponent', () => {
  let component: MultipleChoiceFilterComponent;
  let fixture: ComponentFixture<MultipleChoiceFilterComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleChoiceFilterComponent);
    component = fixture.componentInstance;
    const corpus = _.cloneDeep(mockCorpus);
    corpus.fields.push(mockFieldMultipleChoice);
    component.queryModel = new QueryModel(corpus);
    component.filter = component.queryModel.filterForField(mockFieldMultipleChoice);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
