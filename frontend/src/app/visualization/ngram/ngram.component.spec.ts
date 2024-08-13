import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { QueryModel } from '@models';
import { mockCorpus } from '../../../mock-data/corpus';
import { MockCorpusResponse } from '../../../mock-data/corpus-response';
import { commonTestBed } from '../../common-test-bed';
import { NgramComponent } from './ngram.component';
import { ApiService } from '@services';
import { ApiServiceMock } from '../../../mock-data/api';
import { Subject } from 'rxjs';

describe('NgramComponent', () => {
  let component: NgramComponent;
  let fixture: ComponentFixture<NgramComponent>;
  let apiService: ApiServiceMock;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
}));

  beforeEach(() => {
    apiService = new ApiServiceMock({});
    spyOn(apiService, 'abortTasks');
    fixture = TestBed.overrideComponent(NgramComponent, {
      set: {
        providers: [
          { provide: ApiService, useValue: apiService}
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

  it('should stop polling and abort running tasks when changing settings', () => {
    const dropdown = fixture.debugElement.query(By.css('ia-dropdown'));
    const changeSizeDropdown = (value: number) => {
        const eventObj = { parameter: 'size', value };
        dropdown.triggerEventHandler('onChange', eventObj);
    };
    spyOn(fixture.componentInstance.stopPolling$, 'next');
    changeSizeDropdown(10);
    expect(fixture.componentInstance.stopPolling$.next).toHaveBeenCalled();
    component.dataHasLoaded = false; // fake working response
    expect(component.tasksToCancel).toBeUndefined();
  });

  it('should stop polling and abort running tasks on destroy', () => {
    spyOn(component.stopPolling$, 'next');
    component.teardown();
    expect(component.stopPolling$.next).toHaveBeenCalled();
    component.dataHasLoaded = false; // fake working response
    expect(component.tasksToCancel).toBeUndefined();
  });

});
