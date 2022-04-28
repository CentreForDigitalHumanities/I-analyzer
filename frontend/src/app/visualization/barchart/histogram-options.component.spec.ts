import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../../common-test-bed';

import { HistogramOptionsComponent } from './histogram-options.component';

describe('HistogramOptionsComponent', () => {
  let component: HistogramOptionsComponent;
  let fixture: ComponentFixture<HistogramOptionsComponent>;

  beforeEach(waitForAsync(() => {
      commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistogramOptionsComponent);
    component = fixture.componentInstance;
    component.queries = ['spam', 'spam', 'eggs', 'spam'];
    component.showTokenCountOption = true;
    component.isLoading = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
