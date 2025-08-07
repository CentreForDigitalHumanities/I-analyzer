import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SelectFieldComponent } from './select-field.component';
import { commonTestBed } from '../common-test-bed';
import { mockCorpus3, } from '../../mock-data/corpus';
import { QueryModel } from '@models';

describe('SelectFieldComponent', () => {
  let component: SelectFieldComponent;
  let fixture: ComponentFixture<SelectFieldComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFieldComponent);
    component = fixture.componentInstance;
    component.queryModel = new QueryModel(mockCorpus3);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
