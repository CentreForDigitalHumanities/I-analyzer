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
    component.document = {id: '42', relevance: 42, fieldValues: {image_path: 'great/image/path'}};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

export class MockElementRef { nativeElement = {}; }