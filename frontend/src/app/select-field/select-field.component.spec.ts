import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SelectFieldComponent } from './select-field.component';
import { commonTestBed } from '../common-test-bed';
import { mockField, mockField2 } from '../../mock-data/corpus';

describe('SelectFieldComponent', () => {
  let component: SelectFieldComponent;
  let fixture: ComponentFixture<SelectFieldComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFieldComponent);
    component = fixture.componentInstance;
    component.corpusFields = [mockField, mockField2];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
