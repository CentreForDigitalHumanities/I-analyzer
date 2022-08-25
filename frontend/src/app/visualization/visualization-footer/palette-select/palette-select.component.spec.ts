import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaletteSelectComponent } from './palette-select.component';

describe('PaletteSelectComponent', () => {
  let component: PaletteSelectComponent;
  let fixture: ComponentFixture<PaletteSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaletteSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaletteSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
