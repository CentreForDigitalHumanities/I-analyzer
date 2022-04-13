import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ApiService, ApiRetryService, ElasticSearchService, LogService, QueryService, SearchService, UserService, DialogService } from '../services/index';
import { ApiServiceMock } from '../../mock-data/api';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';
import { UserServiceMock } from '../../mock-data/user';
import { DialogServiceMock } from '../../mock-data/dialog';
import { HistogramComponent } from './histogram.component';

describe('HistogramCompoment', () => {
  let component: HistogramComponent;
  let fixture: ComponentFixture<HistogramComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        imports: [ FormsModule ],
        declarations: [ HistogramComponent ],
        providers: [ 
            {
    
                provide: ApiService, useValue: new ApiServiceMock()
            },
            ApiRetryService,
            {
                provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
            },
            LogService,
            QueryService,
            SearchService,
            {
                provide: UserService, useValue: new UserServiceMock()
            },
            { provide: DialogService, useClass: DialogServiceMock },
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
