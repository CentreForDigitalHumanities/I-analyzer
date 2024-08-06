import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpusFormComponent } from './corpus-form.component';

describe('CorpusFormComponent', () => {
  let component: CorpusFormComponent;
  let fixture: ComponentFixture<CorpusFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorpusFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CorpusFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
