import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MapVizComponent } from './map.component';
import { commonTestBed } from '../../common-test-bed';

describe('MapVizComponent', () => {
  let component: MapVizComponent;
  let fixture: ComponentFixture<MapVizComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapVizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
