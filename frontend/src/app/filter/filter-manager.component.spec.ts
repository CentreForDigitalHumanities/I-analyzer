import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { FilterManagerComponent } from './filter-manager.component';
import { mockCorpus, mockCorpus2, mockFilter } from '../../mock-data/corpus';
import { convertToParamMap } from '@angular/router';
import { findByName } from '../utils/utils';

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

  it('parses parameters to filters', () => {
    expect(component.activeFilters.length).toEqual(0);
    const params = convertToParamMap({great_field: 'checked'});
    component.setStateFromParams(params);
    expect(component.activeFilters.length).toEqual(1);
  });

  it('toggles filters on and off', async() => {
    findByName(component.corpusFields, 'great_field').searchFilter.useAsFilter = true;
    const params = component.filtersChanged();
    expect(Object.keys(params)).toContain('great_field');
  });
});
