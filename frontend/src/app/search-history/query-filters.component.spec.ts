import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { QueryFiltersComponent } from './query-filters.component';

describe('QueryFiltersComponent', () => {
  let component: QueryFiltersComponent;
  let fixture: ComponentFixture<QueryFiltersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule ],
      declarations: [ QueryFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryFiltersComponent);
    component = fixture.componentInstance;
    component.queryModel = <any>{
        queryText: 'testing',
        filters: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
