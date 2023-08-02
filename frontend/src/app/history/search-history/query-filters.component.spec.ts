import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { QueryModel } from '../../models';
import { mockCorpus } from '../../../mock-data/corpus';
import { commonTestBed } from '../../common-test-bed';

import { QueryFiltersComponent } from './query-filters.component';

describe('QueryFiltersComponent', () => {
  let component: QueryFiltersComponent;
  let fixture: ComponentFixture<QueryFiltersComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryFiltersComponent);
    component = fixture.componentInstance;
    component.queryModel = new QueryModel(mockCorpus);
    component.queryModel.setQueryText('testing');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
