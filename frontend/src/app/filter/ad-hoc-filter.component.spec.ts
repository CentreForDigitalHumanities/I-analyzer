import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdHocFilterComponent } from './ad-hoc-filter.component';

describe('AdHocFilterComponent', () => {
  let component: AdHocFilterComponent;
  let fixture: ComponentFixture<AdHocFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdHocFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdHocFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
