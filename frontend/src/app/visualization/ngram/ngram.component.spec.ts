import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { QueryModel } from '@models';
import { mockCorpus } from '../../../mock-data/corpus';
import { MockCorpusResponse } from '../../../mock-data/corpus-response';
import { commonTestBed } from '../../common-test-bed';
import { NgramComponent } from './ngram.component';
import { ApiService, VisualizationService } from '@services';
import { ApiServiceMock, fakeNgramResult } from '../../../mock-data/api';
import { VisualizationServiceMock } from '../../../mock-data/visualization';
import { Subject } from 'rxjs';
import { NgramSettings } from '@models/ngram';


describe('NgramComponent', () => {
  let component: NgramComponent;
  let fixture: ComponentFixture<NgramComponent>;
  let apiService: ApiServiceMock;
  let visualizationService: VisualizationService;
  let cacheKey = 's:2,p:any,c:false,a:none,m:50,n:10,f:date';
  let defaultSettings = {
    size: 2,
    positions: 'any',
    freqCompensation: false,
    analysis: 'none',
    maxDocuments: 50,
    numberOfNgrams: 10,
    dateField: 'date'
  } as NgramSettings;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
}));

  beforeEach(() => {
    apiService = new ApiServiceMock({});
    visualizationService = new VisualizationServiceMock() as any;
    spyOn(visualizationService, 'getNgramTasks').and.callThrough();
    spyOn(apiService, 'abortTasks').and.callThrough();
    fixture = TestBed.overrideComponent(NgramComponent, {
      set: {
        providers: [
          { provide: ApiService, useValue: apiService },
          { provide: VisualizationService, useValue: visualizationService }
        ]
      }
    }).createComponent(NgramComponent);
    component = fixture.componentInstance;
    const queryModel = new QueryModel(mockCorpus);
    queryModel.setQueryText('testing');
    component.stopPolling$ = new Subject();
    component.queryModel = queryModel;
    component.corpus = MockCorpusResponse[0] as any;
    component.visualizedField = {name: 'speech'} as any;
    component.asTable = false;
    component.palette = ['yellow', 'blue'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize ngramParameters with default values', () => {
    expect(component.ngramParameters.state$.value).toEqual(defaultSettings);
  });

  it('should not abort tasks when `onParameterChange` is triggered during initialization', () => {
    spyOn(component.stopPolling$, 'next');
    component.onParameterChange('size', 2);
    expect(component.stopPolling$.next).not.toHaveBeenCalled();
  })

  it('should stop polling and abort running tasks when changing settings', () => {
    const dropdown = fixture.debugElement.query(By.css('ia-dropdown'));
    const changeSizeDropdown = (value: number) => {
        const eventObj = { parameter: 'size', value };
        dropdown.triggerEventHandler('onChange', eventObj);
    };
    spyOn(component.stopPolling$, 'next');
    changeSizeDropdown(10);
    expect(component.stopPolling$.next).toHaveBeenCalled();
    component.dataHasLoaded = false; // fake working response
    expect(component.tasksToCancel).toBeUndefined();
  });

  it('should stop polling and abort running tasks on destroy', () => {
    spyOn(component.stopPolling$, 'next');
    component.ngOnDestroy();
    expect(component.stopPolling$.next).toHaveBeenCalled();
    component.dataHasLoaded = false; // fake working response
    expect(component.tasksToCancel).toBeUndefined();
  });

  it('should send a new ngram request after confirmed changes', () => {
    component.confirmChanges();
    expect(visualizationService.getNgramTasks).toHaveBeenCalled();
  });

  it('should not send a new ngram request when the result is cached', () => {
    component.resultsCache = {[cacheKey]: fakeNgramResult};
    component.confirmChanges();
    expect(visualizationService.getNgramTasks).not.toHaveBeenCalled();
  })

});
