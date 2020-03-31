import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConservationComponent } from './conservation.component';

describe('ConservationComponent', () => {
  let component: ConservationComponent;
  let fixture: ComponentFixture<ConservationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConservationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
