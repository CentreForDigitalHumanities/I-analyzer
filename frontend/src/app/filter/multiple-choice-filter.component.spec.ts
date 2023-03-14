import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

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
    component.optionsAndCounts = [{key: 'Andy', doc_count: 2}, {key: 'Lou', doc_count: 3}];
    component.data = {
        options: ['Andy', 'Lou'],
        selected: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
