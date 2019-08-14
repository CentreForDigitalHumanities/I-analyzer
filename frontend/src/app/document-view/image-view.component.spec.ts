import { ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ImageViewerModule } from 'ng2-image-viewer';

import { ImageViewComponent } from './image-view.component';
import { DocumentViewComponent } from './document-view.component';

describe('ImageViewComponent', () => {
  let component: ImageViewComponent;
  let fixture: ComponentFixture<ImageViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageViewComponent ],
      imports: [ FormsModule, ImageViewerModule ],
      providers: [ DocumentViewComponent, {provide: ElementRef, useClass: MockElementRef} ]
    })
    .compileComponents();
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