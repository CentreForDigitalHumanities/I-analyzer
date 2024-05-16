import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefinitionJsonUploadComponent } from './definition-json-upload.component';

describe('DefinitionJsonUploadComponent', () => {
  let component: DefinitionJsonUploadComponent;
  let fixture: ComponentFixture<DefinitionJsonUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DefinitionJsonUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefinitionJsonUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
