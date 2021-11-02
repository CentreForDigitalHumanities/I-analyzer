import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollocationComponent } from './collocation.component';

describe('CollocationComponent', () => {
  let component: CollocationComponent;
  let fixture: ComponentFixture<CollocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CollocationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
