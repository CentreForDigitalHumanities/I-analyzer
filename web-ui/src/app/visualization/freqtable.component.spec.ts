import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FreqtableComponent } from './freqtable.component';

describe('FreqtableComponent', () => {
  let component: FreqtableComponent;
  let fixture: ComponentFixture<FreqtableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
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
