import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { MultiSelectModule } from 'primeng/primeng';

import { commonTestBed } from '../common-test-bed';

import * as corpus from '../../mock-data/corpus';
import { ApiService, DownloadService, ElasticSearchService, NotificationService } from '../services/index';
import { ApiServiceMock } from '../../mock-data/api';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';

import { DownloadComponent } from './download.component';
import { SelectFieldComponent } from './select-field.component';

import { BalloonDirective } from '../balloon.directive';

describe('DownloadComponent', () => {
  let component: DownloadComponent;
  let fixture: ComponentFixture<DownloadComponent>;

  beforeEach(async(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadComponent);
    component = fixture.componentInstance;
    component.corpus = <any>{
        fields: [{
            displayName: 'Test Field', name: 'test_field'
        }]
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
