import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TitleCasePipe } from '@angular/common';

import { FreqtableComponent } from './freqtable.component';

describe('FreqtableComponent', () => {
  let component: FreqtableComponent;
  let fixture: ComponentFixture<FreqtableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [TitleCasePipe],
      declarations: [FreqtableComponent]
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
