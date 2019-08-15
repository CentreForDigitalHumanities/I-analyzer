import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { ImageViewComponent } from './image-view.component';

describe('ImageViewComponent', () => {
  let component: ImageViewComponent;
  let fixture: ComponentFixture<ImageViewComponent>;

  beforeEach(async(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageViewComponent);
    component = fixture.componentInstance;
    component.images = ['https://image1.jpg', 'https://image2.jpg'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

export class MockElementRef { nativeElement = {}; }