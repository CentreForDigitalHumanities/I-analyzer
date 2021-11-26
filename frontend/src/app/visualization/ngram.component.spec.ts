import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgramComponent } from './ngram.component';

describe('NgramComponent', () => {
  let component: NgramComponent;
  let fixture: ComponentFixture<NgramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgramComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
