import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestBed } from '../common-test-bed';

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
