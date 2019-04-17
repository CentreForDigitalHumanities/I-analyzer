import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { MultiSelectModule } from 'primeng/primeng';

import * as corpus from '../../mock-data/corpus';
import { ApiService, DownloadService, ElasticSearchService, NotificationService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { ElasticSearchServiceMock } from '../services/elastic-search.service.mock';

import { DownloadComponent } from './download.component';
import { SelectFieldComponent } from './select-field.component';

import { BalloonDirective } from '../balloon.directive';

describe('DownloadComponent', () => {
  let component: DownloadComponent;
  let fixture: ComponentFixture<DownloadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        declarations: [ BalloonDirective, DownloadComponent, SelectFieldComponent ],
        imports: [ FormsModule, MultiSelectModule ],
        providers: [
            {
                provide: ApiService, useValue: new ApiServiceMock({
                    ['corpus']: corpus.MockCorpusResponse
                })
            },
            DownloadService,
            {
                provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
            },
            NotificationService
        ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
