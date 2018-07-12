import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FreqtableComponent } from './freqtable.component';

describe('FreqtableComponent', () => {
  let component: FreqtableComponent;
  let fixture: ComponentFixture<FreqtableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FreqtableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FreqtableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
