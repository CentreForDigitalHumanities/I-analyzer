import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeIntervalSliderComponent } from './time-interval-slider.component';

describe('TimeIntervalSliderComponent', () => {
  let component: TimeIntervalSliderComponent;
  let fixture: ComponentFixture<TimeIntervalSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeIntervalSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeIntervalSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
