import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { commonTestBed } from '../../common-test-bed';
import { DefinitionJsonUploadComponent } from './definition-json-upload.component';

describe('DefinitionJsonUploadComponent', () => {
  let component: DefinitionJsonUploadComponent;
  let fixture: ComponentFixture<DefinitionJsonUploadComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

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
