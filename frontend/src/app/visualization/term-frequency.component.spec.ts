import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TermFrequencyComponent } from './term-frequency.component';

describe('TermFrequencyComponent', () => {
  let component: TermFrequencyComponent;
  let fixture: ComponentFixture<TermFrequencyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TermFrequencyComponent ]
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
