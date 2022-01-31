import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistogramOptionsComponent } from './histogram-options.component';

describe('HistogramOptionsComponent', () => {
  let component: HistogramOptionsComponent;
  let fixture: ComponentFixture<HistogramOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistogramOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistogramOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
