import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { BooleanFilterComponent } from './boolean-filter.component';

describe('BooleanFilterComponent', () => {
  let component: BooleanFilterComponent;
  let fixture: ComponentFixture<BooleanFilterComponent>;

  beforeEach(async(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanFilterComponent);
    component = fixture.componentInstance;
    component.filter = {
        fieldName: 'A yes/no question',
        description: 'What is the average speed of a swallow?',
        useAsFilter: false,
        defaultData: {
            filterType: 'BooleanFilter',
            checked: false
        },
        currentData: {
            filterType: 'BooleanFilter',
            checked: true
        }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
