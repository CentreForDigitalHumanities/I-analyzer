import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Params } from '@angular/router';
import { commonTestBed } from '../../common-test-bed';
import { NgramComponent } from './ngram.component';

describe('NgramComponent', () => {
  let component: NgramComponent;
  let fixture: ComponentFixture<NgramComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
}));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the currentParameters with the right type', () => {
    const params = {'size': '5', 'numberOfNGrams': '70'} as Params;
    component.setParameters(params);
    expect(component.currentParameters.size).toEqual(5);
  });
});
