import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanImageComponent } from './scan-image.component';

describe('ScanImageComponent', () => {
  let component: ScanImageComponent;
  let fixture: ComponentFixture<ScanImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScanImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
