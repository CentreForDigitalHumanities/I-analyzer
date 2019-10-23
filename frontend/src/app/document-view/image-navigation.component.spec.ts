import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageNavigationComponent } from './image-navigation.component';

describe('ImageNavigationComponent', () => {
  let component: ImageNavigationComponent;
  let fixture: ComponentFixture<ImageNavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageNavigationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
