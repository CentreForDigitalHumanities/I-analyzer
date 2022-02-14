import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

import { FreqtableComponent } from './freqtable.component';

describe('FreqtableComponent', () => {
  let component: FreqtableComponent;
  let fixture: ComponentFixture<FreqtableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, TableModule],
      providers: [],
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
