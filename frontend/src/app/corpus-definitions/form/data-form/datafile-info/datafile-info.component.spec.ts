import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatafileInfoComponent } from './datafile-info.component';

describe('DatafileInfoComponent', () => {
  let component: DatafileInfoComponent;
  let fixture: ComponentFixture<DatafileInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatafileInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DatafileInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
