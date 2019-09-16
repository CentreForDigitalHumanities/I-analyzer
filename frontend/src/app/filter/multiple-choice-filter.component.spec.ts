import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleChoiceFilterComponent } from './multiple-choice-filter.component';

describe('MultipleChoiceFilterComponent', () => {
  let component: MultipleChoiceFilterComponent;
  let fixture: ComponentFixture<MultipleChoiceFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultipleChoiceFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleChoiceFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
