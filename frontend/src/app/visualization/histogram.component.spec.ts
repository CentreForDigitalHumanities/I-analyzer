import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ApiService, ApiRetryService, DataService, ElasticSearchService, LogService, QueryService, SearchService, UserService } from '../services/index';
import { ApiServiceMock } from '../../mock-data/api';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';
import { UserServiceMock } from '../../mock-data/user';
import { HistogramComponent } from './histogram.component';

describe('HistogramCompoment', () => {
  let component: HistogramComponent;
  let fixture: ComponentFixture<HistogramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [ FormsModule ],
        declarations: [ HistogramComponent ],
        providers: [ 
            {
    
                provide: ApiService, useValue: new ApiServiceMock()
            },
            ApiRetryService,
            DataService,
            {
                provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
            },
            LogService,
            QueryService,
            SearchService,
            {
                provide: UserService, useValue: new UserServiceMock()
            }
        ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
