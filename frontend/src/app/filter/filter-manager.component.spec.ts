import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { FilterManagerComponent } from './filter-manager.component';
import { mockCorpus, mockCorpus2 } from '../../mock-data/corpus';

describe('FilterManagerComponent', () => {
  let component: FilterManagerComponent;
  let fixture: ComponentFixture<FilterManagerComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterManagerComponent);
    component = fixture.componentInstance;
    component.corpus = mockCorpus;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.searchFilters.length).toEqual(1);
  });

  it('resets filters when corpus changes', () => {
    component.corpus = mockCorpus2;
    component.initialize();
    expect(component.searchFilters.length).toEqual(0);
    component.corpus = mockCorpus;
    component.initialize();
    expect(component.searchFilters.length).toEqual(1);
  });
});
