import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ApiService, ApiRetryService, DataService, ElasticSearchService, LogService, QueryService, SearchService, UserService } from '../services/index';
import { ApiServiceMock } from '../../mock-data/api';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';
import { UserServiceMock } from '../../mock-data/user';

import { TimelineComponent } from './timeline.component';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule ],
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
      declarations: [ TimelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
