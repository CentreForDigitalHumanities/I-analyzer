import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table'

import { DataService } from '../services/index';
import { FreqtableComponent } from './freqtable.component';

describe('FreqtableComponent', () => {
  let component: FreqtableComponent;
  let fixture: ComponentFixture<FreqtableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, TableModule],
      providers: [TitleCasePipe, DataService],
      declarations: [FreqtableComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FreqtableComponent);
    component = fixture.componentInstance;
    component.visualizedField = <any>{
        displayName: 'TestField'
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
