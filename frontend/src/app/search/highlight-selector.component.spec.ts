import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockCorpus2 } from '../../mock-data/corpus';
import { commonTestBed } from '../common-test-bed';
import { QueryModel } from '../models';

import { HighlightSelectorComponent } from './highlight-selector.component';

describe('HighlightSelectorComponent', () => {
  let component: HighlightSelectorComponent;
  let fixture: ComponentFixture<HighlightSelectorComponent>;

  beforeEach(async () => {
    commonTestBed().testingModule.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HighlightSelectorComponent);
    component = fixture.componentInstance;
    component.queryModel = new QueryModel(mockCorpus2);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
