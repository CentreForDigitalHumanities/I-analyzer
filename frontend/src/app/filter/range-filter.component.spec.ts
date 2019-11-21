import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { RangeFilterComponent } from './range-filter.component';
import { RangeFilterData } from '../models';

describe('RangeFilterComponent', () => {
  let component: RangeFilterComponent;
  let fixture: ComponentFixture<RangeFilterComponent>;

  beforeEach(async(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RangeFilterComponent);
    component = fixture.componentInstance;
    let mockRangeData = {
        filterType: 'RangeFilter',
        min: 1984,
        max: 1984
    } as RangeFilterData;
    let data = { 
        fieldName: 'year',
        description: 'Orwellian',
        useAsFilter: false,
        defaultData: mockRangeData,
        currentData: mockRangeData
    }
    component.filter = data;
    component.data = data;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
