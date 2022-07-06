import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HighlightSelectorComponent } from './highlight-selector.component';

describe('HighlightSelectorComponent', () => {
  let component: HighlightSelectorComponent;
  let fixture: ComponentFixture<HighlightSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HighlightSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HighlightSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
