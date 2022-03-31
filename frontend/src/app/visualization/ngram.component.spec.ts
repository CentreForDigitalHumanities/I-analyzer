import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApiService, ApiRetryService, LogService, QueryService, UserService, ElasticSearchService, SearchService } from '../services/index';
import { ApiServiceMock } from '../../mock-data/api';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';
import { UserServiceMock } from '../../mock-data/user';
import { NgramComponent } from './ngram.component';

describe('NgramComponent', () => {
  let component: NgramComponent;
  let fixture: ComponentFixture<NgramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgramComponent ],
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
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
