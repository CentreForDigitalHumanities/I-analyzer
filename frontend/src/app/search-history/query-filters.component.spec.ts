import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { commonTestBed } from '../common-test-bed';

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
    component.queryModel = <any>{
        queryText: 'testing',
        filters: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
