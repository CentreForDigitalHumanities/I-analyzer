import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { convertToParamMap, Params } from '@angular/router';
import { MockCorpusResponse } from '../../../mock-data/corpus-response';
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
    component.queryModel = <any>{
        queryText: 'testing',
        filters: []
    };
    component.corpus = <any>MockCorpusResponse['test1'];
    component.visualizedField = <any>{name: 'speech'};
    component.asTable = false;
    component.palette = ['yellow', 'blue'];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the currentParameters with the right type', () => {
    const params = convertToParamMap({size: '5'});
    component.setParameters(params);
    expect(component.currentParameters.size).toEqual(5);
    const newParams = convertToParamMap({size: '2'});
    component.setParameters(newParams);
    expect(component.currentParameters.size).toEqual(2);
  });
});
