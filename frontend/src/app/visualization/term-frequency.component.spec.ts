import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ApiService, ApiRetryService, DataService, ElasticSearchService, LogService, QueryService, SearchService, UserService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { ElasticSearchServiceMock } from '../services/elastic-search.service.mock';
import { UserServiceMock } from '../services/user.service.mock';
import { TermFrequencyComponent } from './term-frequency.component';

describe('TermFrequencyComponent', () => {
  let component: TermFrequencyComponent;
  let fixture: ComponentFixture<TermFrequencyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [ FormsModule ],
        declarations: [ TermFrequencyComponent ],
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
    fixture = TestBed.createComponent(TermFrequencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
