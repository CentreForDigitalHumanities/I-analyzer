import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../../common-test-bed';

import { barchartOptionsComponent } from './barchart-options.component';

describe('barchartOptionsComponent', () => {
  let component: barchartOptionsComponent;
  let fixture: ComponentFixture<barchartOptionsComponent>;

  beforeEach(waitForAsync(() => {
      commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(barchartOptionsComponent);
    component = fixture.componentInstance;
    component.queryText = 'spam';
    component.showTokenCountOption = true;
    component.isLoading = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
