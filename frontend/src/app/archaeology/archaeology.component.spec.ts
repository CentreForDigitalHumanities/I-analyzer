import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchaeologyComponent } from './archaeology.component';

describe('ArchaeologyComponent', () => {
  let component: ArchaeologyComponent;
  let fixture: ComponentFixture<ArchaeologyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArchaeologyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchaeologyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
