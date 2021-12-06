import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchTermFrequencyComponent } from './search-term-frequency.component';

describe('SearchTermFrequencyComponent', () => {
  let component: SearchTermFrequencyComponent;
  let fixture: ComponentFixture<SearchTermFrequencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchTermFrequencyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchTermFrequencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
