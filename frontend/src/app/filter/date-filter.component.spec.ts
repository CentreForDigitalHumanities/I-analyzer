import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { DateFilterComponent } from './date-filter.component';

describe('DateFilterComponent', () => {
  let component: DateFilterComponent;
  let fixture: ComponentFixture<DateFilterComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateFilterComponent);
    component = fixture.componentInstance;
    component.filter = {
        fieldName: 'Publication date',
        description: 'When this book was published',
        useAsFilter: false,
        defaultData: {
            filterType: 'DateFilter',
            min: '1099-01-01',
            max: '1300-12-31'
        },
        currentData: {
            filterType: 'DateFilter',
            min: '1111-01-01',
            max: '1299-12-31'
        }
    };
    component.data = {
        minYear: 1099,
        maxYear: 1300
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
