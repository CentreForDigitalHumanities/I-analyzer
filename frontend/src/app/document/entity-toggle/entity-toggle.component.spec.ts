import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityToggleComponent } from './entity-toggle.component';

describe('EntityToggleComponent', () => {
  let component: EntityToggleComponent;
  let fixture: ComponentFixture<EntityToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityToggleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntityToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
